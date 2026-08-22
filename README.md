# IELTS SHADOWLAB v5.2 — Stable Analyze + Landing Account Gate

This build keeps the v5.1 landing/account UX, but replaces the unstable v5 Analyze wiring.

## Analyze stabilization
- Production baseline is WASM q4 for broader phone/browser compatibility.
- Uses the model's official Transformers.js `automatic-speech-recognition` pipeline.
- No hand-wired `AutoModelForCTC + feature extractor + custom logits decoder` in production.
- The worker performs a real 0.8-second local inference preflight after loading.
- Long recordings use the official CTC `chunk_length_s` / `stride_length_s` pipeline options.
- A valid PCM recording is NOT transferred/destructively detached from the page state.
- Analyze errors preserve the same recording, so students can press **Retry Analyze** without recording again.
- Analyze requests have a 5-minute watchdog; timeout does not delete the recording.
- Shadow and Recall still share one phoneme model.

## Deployment preflight
After Netlify deploy, open `/test-launch.html` on the actual device/browser and press **Run real engine preflight**.
A PASS means model download/cache + ONNX/WASM inference actually executed on that device.
Static source QA is not presented as proof of runtime inference.

## Existing v5 features retained
- Valid/rejected Shadow and Recall recording counters.
- Dynamic minimum voiced-speech requirement.
- Recording rejected if the page/app is hidden during recording.
- Active question timer pauses when the page is hidden.
- Context IPA manifest for all route variants.
- Recall gate requires >=80% manually curated target chunks.
- Grouped Teacher Dashboard and filters.
- v5.1 landing page + saved student account gate + restored Teacher Area.

## Database
No SQL migration and no new Netlify environment variables are required.
