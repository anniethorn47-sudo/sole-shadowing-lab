# IELTS SHADOWLAB v5.2.1 — Stop + Vietnamese Coach Hotfix

Hotfix on top of v5.2 Stable Analyze.

## Recording Stop fix
- AudioWorklet now sends an explicit `stopped` acknowledgement after the final PCM flush.
- Stop waits for the flush acknowledgement (max 850 ms), not for `AudioContext.close()`.
- `AudioContext.close()` runs asynchronously after the recording has been finalized, so mobile browsers cannot freeze the Stop flow at that point.
- Stop finalization is wrapped in try/catch and always restores the recording controls.
- A valid PCM recording immediately creates a WAV playback and enables Analyze.
- If finalization fails, the UI shows a Vietnamese error and returns to a recordable state instead of getting stuck.

## Vietnamese coach restored
Listening, recording, retry, pronunciation-gate and Recall nudges are Vietnamese again.

## Core retained
Stable WASM q4 Analyze pipeline, Context IPA, 80% Recall target gate, recording counters, active-time tracking, landing/account gate and Teacher Area are unchanged.

No SQL migration or new environment variables are required.
