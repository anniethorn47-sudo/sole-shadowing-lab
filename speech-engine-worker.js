import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';

// IELTS SHADOWLAB v5.2 — stability-first phoneme worker.
// Production deliberately uses the browser's WASM backend + q4 weights.
// We use the model's official Transformers.js automatic-speech-recognition pipeline
// instead of manually wiring model / feature extractor / logits decoding.
const MODEL_ID = 'onnx-community/wav2vec2-ljspeech-gruut-ONNX';
const SAMPLE_RATE = 16000;
const DTYPE = 'q4';
const CHUNK_LENGTH_S = 8;
const STRIDE_LENGTH_S = 1;
let transcriber = null;
let loading = null;
let engine = null;
let lastProgress = -1;

function postStatus(state, title, detail = '') {
  self.postMessage({ type: 'status', state, title, detail, engine });
}

function progress(info) {
  if (!info || info.status !== 'progress' || info.progress == null) return;
  const pct = Math.max(0, Math.min(100, Math.round(info.progress)));
  if (pct === lastProgress) return;
  lastProgress = pct;
  postStatus('loading', `Downloading pronunciation model… ${pct}%`, info.file || 'English phoneme model · WASM q4');
}

function cleanPhonemeText(text) {
  return String(text || '')
    .replace(/[ˈˌ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function outputToTokens(output) {
  const text = cleanPhonemeText(output?.text || '');
  if (!text) return [];
  return text.split(/\s+/).filter(Boolean).map(p => ({ p }));
}

function friendlyError(err) {
  const raw = err?.message || String(err || 'Unknown speech-engine error');
  if (/fetch|network|failed to fetch|load.*model|download/i.test(raw)) {
    return `Model download failed. Check the internet connection, then press Retry Analyze. (${raw})`;
  }
  if (/memory|allocation|out of memory|oom/i.test(raw)) {
    return `This device ran out of memory during analysis. Close heavy tabs/apps and press Retry Analyze. (${raw})`;
  }
  if (/session|onnx|wasm|runtime/i.test(raw)) {
    return `The WASM inference session could not run on this browser. Refresh once and retry. (${raw})`;
  }
  return raw;
}

async function dispose() {
  try { await transcriber?.dispose?.(); } catch {}
  transcriber = null;
  loading = null;
  engine = null;
  lastProgress = -1;
}

async function load() {
  if (transcriber) return transcriber;
  if (loading) return loading;
  loading = (async () => {
    postStatus('loading', 'Loading stable pronunciation engine…', 'WASM q4 baseline · first use downloads about 90 MB, then browser cache is reused.');
    const pipe = await pipeline('automatic-speech-recognition', MODEL_ID, {
      dtype: DTYPE,
      progress_callback: progress,
    });
    // Real inference preflight. Silence is fine: success means the ONNX/WASM session actually executed.
    postStatus('loading', 'Running engine preflight…', 'Executing a short local inference before Analyze is enabled.');
    await pipe(new Float32Array(Math.round(SAMPLE_RATE * 0.8)));
    transcriber = pipe;
    engine = { device: 'wasm', dtype: DTYPE, model: MODEL_ID, pipeline: 'automatic-speech-recognition', preflight: true };
    postStatus('ready', 'Pronunciation engine ready', 'WASM q4 preflight passed · Shadow and Recall share this one model.');
    return transcriber;
  })();
  try {
    return await loading;
  } catch (err) {
    await dispose();
    throw new Error(friendlyError(err));
  }
}

async function analyze(pcm) {
  const pipe = await load();
  if (!(pcm instanceof Float32Array) || !pcm.length) throw new Error('No PCM audio was received by the pronunciation worker.');
  const duration = pcm.length / SAMPLE_RATE;
  postStatus('loading', 'Analyzing pronunciation…', duration > 10 ? 'Long recording · official CTC chunking is active.' : 'Single local inference · WASM q4.');
  const options = duration > 10 ? { chunk_length_s: CHUNK_LENGTH_S, stride_length_s: STRIDE_LENGTH_S } : {};
  const output = await pipe(pcm, options);
  const tokens = outputToTokens(output);
  if (!tokens.length) throw new Error('The phoneme model returned no usable speech evidence. Make sure the recording contains clear English speech, then retry.');
  return {
    tokens,
    ipa: tokens.map(x => x.p).join(' '),
    rawText: cleanPhonemeText(output?.text || ''),
    engine: { ...engine, chunked: duration > 10, chunkLengthS: duration > 10 ? CHUNK_LENGTH_S : null },
  };
}

self.onmessage = async (event) => {
  const m = event.data || {};
  if (m.type === 'reset') {
    await dispose();
    self.postMessage({ type: 'reset', id: m.id, ok: true });
    return;
  }
  if (m.type === 'warmup') {
    try {
      await load();
      self.postMessage({ type: 'warmup', id: m.id, ok: true, engine });
    } catch (err) {
      self.postMessage({ type: 'error', id: m.id, error: friendlyError(err) });
    }
    return;
  }
  if (m.type !== 'analyze') return;
  try {
    const pcm = new Float32Array(m.audio);
    const result = await analyze(pcm);
    postStatus('ready', 'Pronunciation engine ready', `${String(result.engine?.device || 'wasm').toUpperCase()} q4 · analysis complete.`);
    self.postMessage({ type: 'result', id: m.id, ...result });
  } catch (err) {
    self.postMessage({ type: 'error', id: m.id, error: friendlyError(err) });
  }
};
