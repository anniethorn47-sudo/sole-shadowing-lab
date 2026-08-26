import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';

// IELTS SHADOWLAB v5.3 — evidence-only phoneme worker (acoustic recognizer, not verdict engine).
// Root cause fixed here: the selected phoneme ONNX repo has vocab/tokenizer_config
// but no tokenizer.json, while Transformers.js v4's tokenizer backend requires it.
// We supply the missing CTC tokenizer from this app ONLY for that exact request.
const MODEL_ID = 'onnx-community/wav2vec2-ljspeech-gruut-ONNX';
const SAMPLE_RATE = 16000;
const DTYPE = 'q4';
const CHUNK_LENGTH_S = 8;
const STRIDE_LENGTH_S = 1;
const MISSING_TOKENIZER_RE = /huggingface\.co\/onnx-community\/wav2vec2-ljspeech-gruut-ONNX\/resolve\/main\/tokenizer\.json(?:\?|$)/i;
const LOCAL_TOKENIZER_URL = new URL('./phoneme-tokenizer.json', self.location.href).href;
const nativeFetch = self.fetch.bind(self);

// The interceptor is deliberately narrow: every other model/config request goes to the network unchanged.
const shadowlabFetch = async function(input, init) {
  const url = typeof input === 'string' ? input : (input?.url || String(input));
  if (MISSING_TOKENIZER_RE.test(url)) {
    const local = await nativeFetch(LOCAL_TOKENIZER_URL, { cache: 'no-store' });
    if (!local.ok) throw new Error(`ShadowLab bundled tokenizer could not be loaded (${local.status}).`);
    return local;
  }
  return nativeFetch(input, init);
};
// Transformers.js v4 supports an explicit custom fetch hook. Use it so the tokenizer
// patch is honored even if the library does not read globalThis.fetch dynamically.
env.fetch = shadowlabFetch;

// Exact inventory from the model's published vocab.json (excluding separators/special tokens).
const PHONE_INVENTORY = [
  'd͡ʒ','t͡ʃ','aɪ','aʊ','eɪ','oʊ','ɔɪ',
  'b','d','f','h','i','j','k','l','m','n','p','s','t','u','v','w','z',
  'æ','ð','ŋ','ɑ','ɔ','ə','ɚ','ɛ','ɡ','ɪ','ɹ','ʃ','ʊ','ʌ','ʒ','θ'
].sort((a,b)=>b.length-a.length);

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
  return String(text || '').replace(/[ˈˌ]/g, '').replace(/\s+/g, ' ').trim();
}
function normalizePhoneText(text) {
  return cleanPhonemeText(text)
    .replaceAll('dʒ','d͡ʒ')
    .replaceAll('tʃ','t͡ʃ')
    .replaceAll('g','ɡ')
    .replaceAll('r','ɹ');
}

// The CTC tokenizer concatenates adjacent phoneme tokens inside each word.
// Re-segment the decoded text using the model's finite phone inventory, longest match first.
function segmentDecodedPhones(text) {
  const src = normalizePhoneText(text);
  const out = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s|\|/.test(ch)) { i++; continue; }
    let hit = null;
    for (const p of PHONE_INVENTORY) {
      if (src.startsWith(p, i)) { hit = p; break; }
    }
    if (hit) { out.push(hit); i += hit.length; continue; }
    // Ignore tokenizer artifacts/specials rather than inventing a phoneme.
    if (src.startsWith('[UNK]', i)) { i += 5; continue; }
    if (src.startsWith('[PAD]', i)) { i += 5; continue; }
    if (src.startsWith('<s>', i)) { i += 3; continue; }
    if (src.startsWith('</s>', i)) { i += 4; continue; }
    // Unknown visible code point: skip exactly one Unicode code point.
    const cp = src.codePointAt(i);
    i += cp > 0xFFFF ? 2 : 1;
  }
  return out;
}
function outputToTokens(output) {
  return segmentDecodedPhones(output?.text || '').map(p => ({ p }));
}
function friendlyError(err) {
  const raw = err?.message || String(err || 'Unknown speech-engine error');
  if (/tokenizer\.json|bundled tokenizer/i.test(raw)) {
    return `Pronunciation tokenizer could not load. Refresh once so the new ShadowLab tokenizer file is cached, then press Retry Analyze. (${raw})`;
  }
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
  transcriber = null; loading = null; engine = null; lastProgress = -1;
}
async function load() {
  if (transcriber) return transcriber;
  if (loading) return loading;
  loading = (async () => {
    postStatus('loading','Loading phoneme evidence engine…','WASM q4 baseline · phone decoding is calibrated by v5.3 before PASS/FAIL.');
    const pipe = await pipeline('automatic-speech-recognition', MODEL_ID, {
      dtype: DTYPE,
      progress_callback: progress,
    });
    postStatus('loading','Running engine preflight…','Executing a short local inference before Analyze is enabled.');
    await pipe(new Float32Array(Math.round(SAMPLE_RATE * 0.8)));
    transcriber = pipe;
    engine = { device:'wasm', dtype:DTYPE, model:MODEL_ID, pipeline:'automatic-speech-recognition', preflight:true, tokenizer:'shadowlab-bundled-ctc-v1', evidenceOnly:true, scoring:'v5.3-evidence-calibrated' };
    postStatus('ready','Phoneme evidence engine ready','WASM q4 preflight passed · CTC output will be calibrated by v5.3 scoring before any verdict.');
    return transcriber;
  })();
  try { return await loading; }
  catch (err) { await dispose(); throw new Error(friendlyError(err)); }
}
async function analyze(pcm) {
  const pipe = await load();
  if (!(pcm instanceof Float32Array) || !pcm.length) throw new Error('No PCM audio was received by the pronunciation worker.');
  const duration = pcm.length / SAMPLE_RATE;
  postStatus('loading','Analyzing pronunciation…',duration > 10 ? 'Long recording · official CTC chunking is active.' : 'Single local inference · WASM q4.');
  const options = duration > 10 ? { chunk_length_s:CHUNK_LENGTH_S, stride_length_s:STRIDE_LENGTH_S } : {};
  const output = await pipe(pcm, options);
  const tokens = outputToTokens(output);
  if (!tokens.length) throw new Error('The phoneme model returned no usable speech evidence. Make sure the recording contains clear English speech, then retry.');
  return {
    tokens,
    ipa: tokens.map(x=>x.p).join(' '),
    rawText: cleanPhonemeText(output?.text || ''),
    engine: { ...engine, chunked:duration>10, chunkLengthS:duration>10?CHUNK_LENGTH_S:null },
  };
}
self.onmessage = async (event) => {
  const m = event.data || {};
  if (m.type === 'reset') { await dispose(); self.postMessage({type:'reset',id:m.id,ok:true}); return; }
  if (m.type === 'warmup') {
    try { await load(); self.postMessage({type:'warmup',id:m.id,ok:true,engine}); }
    catch (err) { self.postMessage({type:'error',id:m.id,error:friendlyError(err)}); }
    return;
  }
  if (m.type !== 'analyze') return;
  try {
    const pcm = new Float32Array(m.audio);
    const result = await analyze(pcm);
    postStatus('ready','Phoneme evidence engine ready',`${String(result.engine?.device||'wasm').toUpperCase()} q4 · phone evidence complete.`);
    self.postMessage({type:'result',id:m.id,...result});
  } catch (err) {
    self.postMessage({type:'error',id:m.id,error:friendlyError(err)});
  }
};
