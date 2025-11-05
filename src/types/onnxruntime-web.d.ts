// Minimal ambient declarations for onnxruntime-web to satisfy TypeScript in-editor checks.
// The library ships its own types but some TS setups can't resolve them through package "exports".
// This file provides a lightweight shim. For full typing, refer to the library's types in node_modules.

declare module 'onnxruntime-web' {
  export type Tensor = any;
  export interface InferenceSession {
    inputNames?: string[];
    run(feeds: Record<string, Tensor>): Promise<Record<string, any>>;
  }

  export const InferenceSession: {
    // create accepts ArrayBuffer or Uint8Array of model data
    create(modelData: ArrayBuffer | Uint8Array | string): Promise<InferenceSession>;
  };

  export class TensorClass {
    constructor(type: string, data: Float32Array | Int32Array | number[] | Uint8Array, dims: number[]);
  }

  export const Tensor: typeof TensorClass;

  export default {
    InferenceSession,
    Tensor,
  } as any;
}
