# IELTS SHADOWLAB v5.2.2 — Analyze Tokenizer Fix

This hotfix keeps the v5.2.1 recording/Stop fix and Vietnamese coaching, and fixes the Analyze model-load failure shown after recording.

## Root cause
The selected Hugging Face phoneme model repository provides `vocab.json`, `tokenizer_config.json`, `special_tokens_map.json`, and ONNX weights, but it does not provide `tokenizer.json`. Transformers.js v4 requires `tokenizer.json` when constructing its tokenizer backend, so Analyze failed before ONNX inference.

## Fix
- Bundles `phoneme-tokenizer.json` inside ShadowLab.
- Uses the Transformers.js v4 `env.fetch` hook to intercept only the missing remote `tokenizer.json` request for this exact model.
- All other model/config/weight requests still go to Hugging Face unchanged.
- The bundled tokenizer vocabulary IDs match the model's published `vocab.json`.
- CTC decoded phoneme strings are re-segmented into individual phoneme tokens before Context IPA alignment.
- Recording PCM is still retained when Analyze fails, so Retry Analyze does not require a new recording.

No SQL migration or Netlify environment-variable change is required.
