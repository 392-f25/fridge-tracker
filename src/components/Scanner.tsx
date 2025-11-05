/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';

interface ScannerProps {
  onBarcodeDetected?: (barcode: string) => void;
  // labels: array of objects with name, score and optional thumbnail (object URL)
  onLabelsDetected?: (labels: Array<{ name: string; score?: number; thumbnail?: string }>) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onBarcodeDetected, onLabelsDetected }) => {
  const readerRef = useRef<HTMLDivElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ONNX session cache
  let onnxLoading = false;
  const MODEL_URL = (import.meta as any).env?.VITE_ONNX_MODEL_URL || '/models/fridge-yolo.onnx';

  const ensureOnnxSession = async () => {
    if ((window as any).__onnx_session) return (window as any).__onnx_session;
    if (onnxLoading) return null;
    onnxLoading = true;
    try {
      const runner = await import('../utils/onnxRunner');
      const s = await runner.createSession(MODEL_URL);
      (window as any).__onnx_session = s;
      return s;
    } catch (e) {
      console.debug('ONNX session create failed', e);
      return null;
    } finally {
      onnxLoading = false;
    }
  };

  useEffect(() => {
    return () => {
      // clean up if component unmounts
      // @ts-ignore
      if (window._html5qrcodeScanner) {
        try {
          // @ts-ignore
          window._html5qrcodeScanner.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  const startCameraScan = async () => {
    setMessage(null);
    setScanning(true);
    try {
      // dynamic import to avoid build-time type issues
      // @ts-ignore
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!readerRef.current) {
        setMessage('No reader element');
        setScanning(false);
        return;
      }
      // @ts-ignore
      const html5QrCode = new Html5Qrcode(readerRef.current.id);
      // expose for cleanup
      // @ts-ignore
      window._html5qrcodeScanner = html5QrCode;
      const config = { fps: 10, qrbox: 250 };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          // treat decodedText as barcode / qrcode string
          if (onBarcodeDetected) onBarcodeDetected(decodedText);
          html5QrCode.stop().catch(() => {});
          setScanning(false);
        },
        (_: any) => {}
      );
    } catch (e: any) {
      console.error('Camera scan failed', e);
      setMessage('Camera scan not available in this environment. You can upload a photo instead.');
      setScanning(false);
    }
  };

  const stopCameraScan = async () => {
    // @ts-ignore
    if (window._html5qrcodeScanner) {
      try {
        // @ts-ignore
        await window._html5qrcodeScanner.stop();
      } catch (e) {}
      // @ts-ignore
      window._html5qrcodeScanner = null;
    }
    setScanning(false);
  };

  const captureFrame = async () => {
    if (!readerRef.current) {
      setMessage('No camera preview available to capture');
      return;
    }
    // try to find a video element that html5-qrcode renders
    const video = readerRef.current.querySelector('video') as HTMLVideoElement | null;
    if (!video) {
      setMessage('Camera preview not found. Make sure camera is started.');
      return;
    }
    try {
      setMessage('Capturing frame...');
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setMessage('Unable to capture frame (canvas error)');
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      // convert to blob and reuse handleFile path
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error('Failed to create image blob'));
          const file = new File([blob], 'capture.jpg', { type: blob.type || 'image/jpeg' });
          await handleFile(file);
          resolve();
        }, 'image/jpeg', 0.95);
      });
    } catch (e) {
      console.error('captureFrame failed', e);
      setMessage('Capture failed. Try again.');
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
      setMessage('Running local image classification...');
    try {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      await new Promise(resolve => { img.onload = resolve; });
      // Try ONNX fast path first if model configured
      try {
        const session = await ensureOnnxSession();
        if (session) {
          const runner = await import('../utils/onnxRunner');
          const onnxResults = await runner.runDetect(session, img, 640, 0.25, 0.45);
          if (onnxResults && onnxResults.length>0) {
            // map to callback shape
            if (onLabelsDetected) onLabelsDetected(onnxResults.map((r: any) => ({ name: r.name, score: r.score, thumbnail: r.thumbnail })));
            return;
          }
        }
      } catch (e) {
        console.debug('onnx detect failed, falling back', e);
      }
      // load tfjs first then coco-ssd dynamically
      // @ts-ignore
      await import('@tensorflow/tfjs');
      // @ts-ignore
      const coco = await import('@tensorflow-models/coco-ssd');
      // @ts-ignore
      const model = await coco.load();
      // @ts-ignore
      const predictions = await model.detect(img as any);
      // build label list with scores from coco-ssd
      const cocoLabels = (predictions || []).map((p: any) => ({ name: p.class, score: p.score || 0 }));

      // As a fallback/additional signal, also run MobileNet image classification which can give
      // more specific object labels (e.g., 'orange' vs 'orange juice'). We'll run it and merge results.
      let mobilenetLabels: Array<{ name: string; score: number }> = [];
      try {
        // @ts-ignore
        const mobilenet = await import('@tensorflow-models/mobilenet');
        // @ts-ignore
        const mnModel = await mobilenet.load();
        // @ts-ignore
        const mnPreds = await mnModel.classify(img as any);
        mobilenetLabels = (mnPreds || []).map((p: any) => ({ name: p.className || p.class || '', score: p.probability || p.score || 0 }));
        console.debug('mobilenet predictions:', mnPreds);
      } catch (e) {
        // mobilenet optional — continue if it fails
        console.debug('mobilenet failed or not available', e);
      }

      // merge coco + mobilenet labels, dedupe by simple lowercase name, prefer higher score
      const combined = [...cocoLabels, ...mobilenetLabels];
      const byName: Record<string, { name: string; score: number }> = {};
      combined.forEach(item => {
        const key = (item.name || '').toLowerCase().trim();
        if (!key) return;
        if (!byName[key] || (item.score || 0) > (byName[key].score || 0)) {
          byName[key] = item;
        }
      });
      const merged = Object.values(byName).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8);

      // Keep the object URL as thumbnail for the candidates (parent will revoke when done)
      const thumb = img.src;

      const labelText = merged.length > 0 ? merged.map(m => `${m.name} (${(m.score || 0).toFixed(2)})`).join(', ') : 'No labels detected';
      setMessage(`Image recognition: ${labelText}`);
      console.debug('coco-ssd predictions:', predictions, 'combined labels:', merged);
      if (onLabelsDetected) onLabelsDetected(merged.map(m => ({ name: m.name, score: m.score, thumbnail: thumb })));
    } catch (e) {
      console.error('Image classification failed', e);
      setMessage('Image recognition failed. Please try another photo.');
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => (scanning ? stopCameraScan() : startCameraScan())} style={{ padding: '8px 12px', borderRadius: 8 }}>
          {scanning ? 'Stop camera' : 'Start camera scan'}
        </button>
        {scanning && (
          <button type="button" onClick={captureFrame} style={{ padding: '8px 12px', borderRadius: 8 }}>
            Capture frame
          </button>
        )}
        <label style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--card-bg)', cursor: 'pointer' }}>
          Upload photo
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)}
          />
        </label>
      </div>

      <div>
        <div id="html5-reader" ref={readerRef} style={{ width: 300, height: 300, borderRadius: 8, overflow: 'hidden', background: '#000' }} />
        {message && <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>{message}</div>}
      </div>
    </div>
  );
};

export default Scanner;
