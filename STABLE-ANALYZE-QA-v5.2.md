# IELTS SHADOWLAB v5.2 — Stable Analyze QA

## Source checks completed before packaging
- `speech-engine-worker.js` uses the official Transformers.js `automatic-speech-recognition` pipeline.
- Production model mode is WASM + q4; WebGPU is not required for Analyze.
- The worker runs a real 0.8-second inference preflight after model load.
- Main-page Analyze sends a **copy** of PCM to the worker, so the valid recording is not detached/deleted.
- Shadow Analyze failure leaves the same valid PCM recording available for **Retry Analyze**.
- Recall check failure leaves the same valid PCM recording available for **Retry target check**.
- 5-minute watchdog rejects a stuck request without deleting the valid recording.
- Stress marks from detected phoneme output are normalized before comparison with the stored stressless IPA manifest.
- Existing active-time, visibility, valid/rejected recording and Recall >=80% logic is retained.
- v5.1 landing/account gate and Teacher Area are retained.

## Runtime preflight
`/test-launch.html` is now a real post-deployment test. It loads the same worker and asks it to perform a real model load + ONNX/WASM inference.

A static packaging test cannot prove that a specific iPhone/Android browser has enough memory or network access. Run the preflight on each target device class after Netlify deployment.
