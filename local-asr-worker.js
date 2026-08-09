// ShadowLab Local ASR v11.1 — compatibility build
// Uses the current ONNX-community Whisper export in FP32/WASM mode.
// We intentionally avoid q8 because current ORT Web can fail to create
// sessions for some older quantized Whisper exports (MatMulNBits scale error).
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';

const MODEL_ID = 'onnx-community/whisper-tiny.en';
let transcriber = null;
let loading = null;

function reportProgress(x) {
  if (x?.status === 'progress' && x?.progress != null) {
    postMessage({
      type: 'status',
      state: 'loading',
      title: `Downloading local AI… ${Math.round(x.progress)}%`,
      detail: x.file || 'Whisper Tiny English · compatibility model',
    });
  }
}

async function getTranscriber() {
  if (transcriber) return transcriber;
  if (loading) return loading;

  postMessage({
    type: 'status',
    state: 'loading',
    title: 'Loading local Whisper compatibility model…',
    detail: 'First use is larger/slower because this build uses FP32 to avoid the q8 ONNX Runtime bug. The model is cached by the browser.',
  });

  loading = pipeline('automatic-speech-recognition', MODEL_ID, {
    device: 'wasm',
    dtype: 'fp32',
    progress_callback: reportProgress,
  }).then((p) => {
    transcriber = p;
    postMessage({ type: 'status', state: 'ready' });
    return p;
  }).catch((err) => {
    loading = null;
    throw err;
  });

  return loading;
}

self.onmessage = async (e) => {
  const m = e.data || {};
  if (m.type !== 'transcribe') return;

  try {
    const pipe = await getTranscriber();
    const audio = new Float32Array(m.audio);

    let output;
    try {
      // Word timestamps are used by ShadowLab for unwanted-break timing.
      output = await pipe(audio, {
        return_timestamps: 'word',
        chunk_length_s: 30,
        stride_length_s: 5,
      });
    } catch (timestampErr) {
      // Keep the lesson usable even if a browser/runtime has trouble with
      // word alignment. Fluency/completeness can still use transcript + mic VAD.
      const basic = await pipe(audio, {
        return_timestamps: false,
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      output = { ...basic, chunks: [], timestamp_warning: timestampErr?.message || String(timestampErr) };
    }

    postMessage({ type: 'result', id: m.id, output });
  } catch (err) {
    postMessage({
      type: 'error',
      id: m.id,
      error: err?.message || String(err),
    });
  }
};
