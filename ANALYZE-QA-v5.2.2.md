# Analyze QA v5.2.2

## Regression fixed
Observed production error: Transformers.js requested a missing `tokenizer.json` from the phoneme model repository.

## Static checks
- Bundled CTC tokenizer JSON parses successfully.
- Base vocabulary contains IDs 0–42 exactly, matching the model's published vocab.
- `[UNK]` = 41 and `[PAD]` = 42.
- Added `<s>` / `</s>` IDs are 43 / 44, matching the model tokenizer metadata.
- Transformers.js `env.fetch` is used for the compatibility intercept.
- Intercept is limited to this exact model's `tokenizer.json` URL.
- Decoded strings are segmented back into individual phones using the exact published inventory.
- Regression segmentation checks include `live` /lɪv/, `live` /laɪv/, /t͡ʃ/, /d͡ʒ/, and diphthongs.
- Recording PCM retention and Retry Analyze behavior from v5.2.1 remain unchanged.

## Deployment test
After deploy, open `/test-launch.html` and run the real engine preflight. A PASS proves the browser could load the bundled tokenizer, download/cache the q4 model, create the WASM session, and execute an inference.
