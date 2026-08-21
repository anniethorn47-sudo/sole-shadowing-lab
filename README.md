# IELTS SHADOWLAB v5.0 — Mobile-first Audio Engine

## What changed
- Home library is a two-column workspace on desktop: scrollable/searchable topics on the left (1/3), questions/achievement dashboard on the right (2/3).
- With no topic selected, the right pane shows the student's server-recorded achievement dashboard.
- One English phoneme model is shared by Shadow and Recall; Whisper is no longer required for pass/fail analysis.
- WebGPU q4f16 is tried first and must pass a real inference test; WASM q4 is the compatibility fallback.
- Long recordings are analyzed in mobile-safe chunks to reduce peak memory.
- Microphone capture uses raw PCM through AudioWorklet, with ScriptProcessor fallback on browsers that cannot start AudioWorklet.
- Valid recording counters are separate for every Shadow sentence and Recall.
- A recording counts only if it contains real audio, enough voiced speech, and stays in the foreground for the full recording.
- Active question time pauses whenever the page becomes hidden / the student switches tab or app.
- Recall pass rule remains: at least 80% of hand-curated target chunks must be acoustically retrieved.
- Teacher dashboard remains grouped by student account and now shows active time and valid recording evidence inside each question.

## Cloud
No SQL migration is required. v5 stores time/recording integrity in the existing `detail_json` field.
`student_progress` now also returns `detail_json` so the student achievement dashboard can show total active time and valid recordings.

## Deploy
Replace the existing GitHub repository contents with this package and commit. Netlify will deploy the site and `netlify/functions/shadowlab.mjs`.

## First-use note
The first Analyze on a device downloads/caches the English phoneme model. WebGPU uses q4f16 when it actually works on that device; otherwise ShadowLab falls back to WASM q4 automatically.
