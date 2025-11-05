/* Lightweight ONNX runner for YOLOv5-like ONNX models
   - Loads onnxruntime-web lazily
   - Supports YOLOv5-style output: [1, N, 85] where 85 = 4(box)+1(obj_conf)+80(class_scores)
   - Provides createSession(modelUrl) and runDetect(session, canvasOrImage, options)
   - Returns array of { name, score, box: [x,y,w,h], thumbnail }
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
const COCO_CLASSES = [
  'person','bicycle','car','motorcycle','airplane','bus','train','truck','boat','traffic light','fire hydrant','stop sign','parking meter','bench','bird','cat','dog','horse','sheep','cow','elephant','bear','zebra','giraffe','backpack','umbrella','handbag','tie','suitcase','frisbee','skis','snowboard','sports ball','kite','baseball bat','baseball glove','skateboard','surfboard','tennis racket','bottle','wine glass','cup','fork','knife','spoon','bowl','banana','apple','sandwich','orange','broccoli','carrot','hot dog','pizza','donut','cake','chair','couch','potted plant','bed','dining table','toilet','tv','laptop','mouse','remote','keyboard','cell phone','microwave','oven','toaster','sink','refrigerator','book','clock','vase','scissors','teddy bear','hair drier','toothbrush'
];

let ort: any = null;

export async function loadOrt() {
  if (ort) return ort;
  // dynamic import
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ort = await import('onnxruntime-web');
  return ort;
}

export async function createSession(modelUrl: string) {
  const ortLib = await loadOrt();
  // fetch model
  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(`Failed to fetch model: ${res.status}`);
  const modelBuf = await res.arrayBuffer();
  // create session
  const session = await ortLib.InferenceSession.create(modelBuf);
  return session;
}

function iou(boxA: number[], boxB: number[]) {
  const [xA,yA,wA,hA] = boxA;
  const [xB,yB,wB,hB] = boxB;
  const ax1 = xA - wA/2, ay1 = yA - hA/2, ax2 = xA + wA/2, ay2 = yA + hA/2;
  const bx1 = xB - wB/2, by1 = yB - hB/2, bx2 = xB + wB/2, by2 = yB + hB/2;
  const interW = Math.max(0, Math.min(ax2,bx2)-Math.max(ax1,bx1));
  const interH = Math.max(0, Math.min(ay2,by2)-Math.max(ay1,by1));
  const inter = interW*interH;
  const union = wA*hA + wB*hB - inter;
  return union<=0?0:inter/union;
}

function nms(boxes: number[][], scores: number[], iouThreshold=0.45) {
  const idxs = scores.map((s,i) => ({s,i})).sort((a,b)=>b.s-a.s).map(x=>x.i);
  const keep: number[] = [];
  while (idxs.length>0) {
    const i = idxs.shift() as number;
    keep.push(i);
    for (let j = idxs.length-1; j>=0; j--) {
      const jj = idxs[j];
      if (iou(boxes[i], boxes[jj]) > iouThreshold) idxs.splice(j,1);
    }
  }
  return keep;
}

export async function runDetect(session: any, img: HTMLImageElement | HTMLCanvasElement, modelSize = 640, confThreshold = 0.25, iouThreshold = 0.45) {
  // ensure ort loaded
  const ortLib = await loadOrt();
  // prepare input tensor from image
  const canvas = document.createElement('canvas');
  canvas.width = modelSize; canvas.height = modelSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');
  // draw image centered & letterbox
  const iw = (img as any).naturalWidth || (img as HTMLCanvasElement).width;
  const ih = (img as any).naturalHeight || (img as HTMLCanvasElement).height;
  const scale = Math.min(modelSize/iw, modelSize/ih);
  const nw = Math.round(iw*scale), nh = Math.round(ih*scale);
  ctx.fillStyle = 'black'; ctx.fillRect(0,0,modelSize,modelSize);
  ctx.drawImage(img as any, Math.floor((modelSize-nw)/2), Math.floor((modelSize-nh)/2), nw, nh);
  const imageData = ctx.getImageData(0,0,modelSize,modelSize);
  const { data } = imageData; // Uint8Clamped
  // create float32 [1,3,H,W] normalized to 0..1
  const floatData = new Float32Array(1*3*modelSize*modelSize);
  let ptr = 0;
  // channel-first
  for (let c=0;c<3;c++){
    for (let y=0;y<modelSize;y++){
      for (let x=0;x<modelSize;x++){
        const idx = (y*modelSize + x)*4 + (2 - c); // data is RGBA, we want RGB order, but put as R,G,B
        floatData[ptr++] = data[idx]/255.0;
      }
    }
  }
  const inputTensor = new ortLib.Tensor('float32', floatData, [1,3,modelSize,modelSize]);
  // find input name
  const inputName = session.inputNames && session.inputNames[0] ? session.inputNames[0] : Object.keys(session.inputTypes || {})[0] || 'images';
  const feeds: any = {};
  feeds[inputName] = inputTensor;
  const output = await session.run(feeds);
  // get first output tensor
  const outNames = Object.keys(output);
  if (outNames.length===0) return [];
  const out = output[outNames[0]] as any;
  const dims = out.dims || (out.shape ? out.shape : null);
  const dataArr = out.data as Float32Array;
  if (!dims || dims.length<3) {
    console.debug('Unexpected ONNX output dims', dims);
    return [];
  }
  const N = dims[1], C = dims[2];
  // assume xywh + obj + classes
  const boxes: number[][] = [];
  const scores: number[] = [];
  const classIds: number[] = [];
  for (let i=0;i<N;i++){
    const base = i*C;
    const xc = dataArr[base+0];
    const yc = dataArr[base+1];
    const w = dataArr[base+2];
    const h = dataArr[base+3];
    const obj = dataArr[base+4];
    // class probs
    let bestClass = -1; let bestProb = 0;
    for (let j=5;j<C;j++){
      const p = dataArr[base+j];
      if (p>bestProb){ bestProb = p; bestClass = j-5; }
    }
    const score = obj * bestProb;
    if (score < confThreshold) continue;
    boxes.push([xc, yc, w, h]);
    scores.push(score);
    classIds.push(bestClass);
  }
  if (boxes.length===0) return [];
  const keepIdx = nms(boxes, scores, iouThreshold);
  const results: Array<any> = [];
  const thumb = canvas.toDataURL('image/jpeg', 0.8);
  for (const i of keepIdx){
    const cid = classIds[i];
    const name = COCO_CLASSES[cid] || `class_${cid}`;
    results.push({ name, score: scores[i], box: boxes[i], thumbnail: thumb });
  }
  return results;
}

export default { loadOrt, createSession, runDetect };
