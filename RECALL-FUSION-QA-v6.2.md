# IELTS SHADOWLAB v6.2 — Recall Fusion QA

## Why Recall changed

The previous scorer converted each target chunk into a binary hit/miss using one local phoneme sequence. With the 80% route gate, this was especially brittle for the **297 route variants with three Recall targets**: one missed chunk meant 2/3 = 67%, even if the student had said the language correctly.

## Corpus audit

- Visible route variants: **546**
- Hand-curated Recall target chunks: **1,851**
- Routes with 2 targets: **18**
- Routes with 3 targets: **297**
- Routes with 4 targets: **231**

The target bank itself is unchanged. All **1,851 / 1,851** Recall targets still map to non-empty context phoneme sequences in the pronunciation manifest.

## v6.2 evidence path

For each valid Recall recording:

1. Chrome/Edge Web Speech captures full-answer transcript evidence in parallel when available.
2. Up to five recognition alternatives per segment are retained.
3. Target chunks are matched with exact + fuzzy lexical evidence.
4. The saved audio is also checked by the local phoneme model.
5. Each target gets a continuous 0–100 fused score rather than a binary hit/miss.
6. Partial evidence contributes to the overall Recall score.
7. Natural pass = blended score >=80 plus strong evidence for at least 60% of targets.
8. Evidence from two **distinct valid recordings** may combine when recognizers miss different chunks.
9. Re-checking the same recording does not create a new attempt.
10. Safety Pass opens after 6 distinct valid Recall recordings and remains teacher-flagged.
11. If both engines fail technically, a valid recording is bypassed/flagged rather than forcing an endless retry.

## Synthetic aggregate regressions

- `[100, 100, 65]` across 3 chunks -> **88% PASS**. A partial third chunk no longer becomes zero.
- `[100, 65, 65]` -> **77% RETRY**. The new scorer is not an automatic pass.
- `[100, 100, 100, 20]` across 4 chunks -> **80% PASS**.
- Two distinct attempts `[90,60,70]` and `[60,90,70]` -> cumulative repeated evidence **83% PASS**.
- Recording 5 with weak evidence -> **no early safety pass**.
- Recording 6 with unresolved recognition -> **Safety Pass**, teacher-flagged.

## Static checks

All v6.2 static checks: **PASS**

- Web Speech Recall capture: True
- Local phoneme fallback: True
- Fuzzy lexical chunk matcher: True
- Continuous chunk scoring: True
- Repeated-evidence pass: True
- Distinct-recording upsert: True
- 6-recording safety valve: True
- Engine bypass: True
- Teacher Recall trace: True
- Cloud Recall transcript persistence: True

## Honest limitation

Static and synthetic QA cannot prove real microphone recognition quality for every browser, accent, or device. v6.2 therefore treats recognition as **evidence**, fuses two paths, retains partial scores, and has explicit bypass/safety behavior instead of pretending that one recognizer is infallible.

## Packaging / syntax QA

- Practice inline JS: PASS
- Teacher inline JS: PASS
- Test-launch inline JS: PASS
- Landing inline JS: PASS
- External JS / worker / worklet / Netlify function syntax: PASS
- Local file references: PASS
