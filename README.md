# IELTS SHADOWLAB v5.3 — Pronunciation Evidence Calibration

This release keeps the stable v5.2.2 WASM q4 phoneme worker/tokenizer fix, but **replaces the pronunciation scoring and PASS/FAIL logic**. The goal is to reduce false failures when the browser phoneme recognizer mis-hears a phone that the learner actually produced correctly.

## What was wrong in v5.2.2

The old scorer:

- aligned the entire detected phone stream against one canonical whole-sentence phone sequence;
- always used only the **first pronunciation variant** stored for each word;
- calculated a word score mainly as exact phone-match percentage;
- could push a short word to 67 or lower after only one phone mismatch;
- capped any context-locked word at 68 after any mismatch;
- could therefore turn recognizer/alignment errors into learner pronunciation failures.

The acoustic model itself is a CTC phoneme recognizer. It is useful evidence, but it is **not a certified pronunciation assessor** and does not return a trustworthy per-phone acoustic confidence that justifies treating every decoded phone as ground truth.

## v5.3 scoring policy

1. **CTC output is evidence, not the verdict.**
2. Every word is first anchored by a soft-cost global alignment, then rescored locally.
3. All stored pronunciation variants are considered; the best supported variant is used.
4. Weak/function words are evidence-only and can never hard-fail the sentence.
5. Common recognizer/allophone confusions receive soft substitution costs instead of binary right/wrong costs.
6. A deletion-only or poorly aligned core word becomes `uncertain`, not automatically `wrong`.
7. A first critical-phone discrepancy is `review` / `suspected` only.
8. Context-locked heteronyms become critical only when the recognizer lands cleanly on a **known competing English pronunciation** (for example `live` /lɪv/ vs /laɪv/), not on arbitrary CTC noise.
9. A critical issue becomes hard-blocking only when the **same evidence repeats on a second valid recording**.
10. If more than 45% of core-word evidence is uncertain, the result is **inconclusive** and the learner is asked to re-record; it is explicitly not labelled a pronunciation failure.
11. Old cached sentence scores use a new v5.3 localStorage key so v5.2 scoring cannot silently carry into the new gate.

## PASS gate

A sentence passes when all are true:

- Overall >= 80
- Pronunciation >= 78
- reliable core words below 70 stay within the 30% gate, with a minimum tolerance of one low word on short sentences
- uncertain core-word evidence <= 45%
- no critical pronunciation issue confirmed across two valid attempts

Overall weighting is now pronunciation-dominant:

- Pronunciation 55%
- Fluency 15%
- Rhythm 15%
- Connected speech 15%

A single unconfirmed critical mismatch does not hard-fail an otherwise strong sentence.

## Teacher calibration / debug

From **Teacher Dashboard**, choose **Calibration mode**. Practice pages opened from that mode include a collapsed Teacher Debug trace showing:

- selected target IPA variant;
- target model phones;
- detected phone segment;
- word score and state (`good`, `review`, `uncertain`, `confirmed`);
- alignment evidence quality and coverage;
- match / substitution / deletion / insertion counts;
- first-pass critical suspicion vs repeated confirmed issue;
- full detected phone stream and segmentation cost.

You can also open any practice URL with `&debug=1`.

Important limitation shown in Debug: the current model inventory does not certify lexical stress or vowel length. IPA display preserves those symbols, but the acoustic comparison normalizes them where the model cannot distinguish them reliably.

## Regression checks completed

- Unit regression groups: 13 / 13 PASS.
- Corpus coverage: 1,046 manifest sentences available.
- Full manifest exact-target pass sweep: 1,046 / 1,046 PASS.
- Full manifest accepted weak-form sweep: 1,046 / 1,046 PASS.
- Evenly distributed noise-regression sample: 220 sentences.
- Simulated single CTC phone-drop trials: 120.
- False **hard** failures from one dropped phone: 0 / 120.
- Existing manifest coverage remains 546 routes / 12,516 context-IPA tokens.

Run locally after any future scoring change:

```bash
node pronunciation-scoring-v5.3.test.cjs
node pronunciation-corpus-regression-v5.3.cjs
```

## Deployment

No SQL migration and no new Netlify environment variable are required. Deploy the entire ZIP root as before. After deployment, run `/test-launch.html` on representative phone/browser types before class use.
