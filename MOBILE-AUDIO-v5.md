# v5 mobile audio design

1. Audio capture uses AudioWorklet raw PCM; ScriptProcessor is a compatibility fallback.
2. MediaRecorder container decoding is no longer part of the scoring path.
3. PCM is resampled to mono 16 kHz for the phoneme model.
4. Recording counters increase only after the integrity gate passes.
5. Leaving the foreground during a recording invalidates and stops that recording.
6. Active question time pauses on `visibilitychange` when `document.hidden` is true.
7. A full model listen is not counted if the page becomes hidden before TTS playback finishes.
8. Shadow and Recall use the same phoneme worker/model.
9. WebGPU is attempted first only when available; a failed load falls back to WASM.
10. Raw audio is not uploaded to Supabase.
