declare module 'heic-decode' {
  interface DecodeResult {
    width: number;
    height: number;
    data: Uint8Array;
  }

  interface DecodeOptions {
    buffer: ArrayBuffer;
  }

  export default function decode(options: DecodeOptions): Promise<DecodeResult>;
}
