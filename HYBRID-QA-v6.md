# IELTS SHADOWLAB v6 — Hybrid Pronunciation QA

- Routes: **546**
- Model sentences: **1046**
- Sentences with automatic pronunciation focus: **500**
- Sentences intentionally without an automatic pronunciation verdict: **546**
- Total automatic focus checks: **648**
- Ending checks: **535**
- Contrast checks: **113**
- Maximum checks in one sentence: **2**

## Benchmark replay

The v6 confidence-competition policy was replayed against the user's Carrier Phrase Lab v2 log. The deliberately unsupported `back` final-/k/ case is excluded because v6 does not auto-gate that family.

- Eligible benchmark attempts: **20**
- Correct attempts naturally passed: **11 / 12**
- Deliberately wrong attempts blocked (`retry` or `unclear`): **8 / 8**
- Missed deliberate errors among eligible benchmark attempts: **0**

One correct `ship` attempt remained unclear because no target or known trap appeared in the alternatives; later correct `ship` attempts did produce usable target evidence. v6 treats that as retry rather than inventing a pronunciation error.

## Structural safeguards

- Same-spelling/context-locked pronunciation targets are excluded from Web Speech gating.
- `back` / final-/k/ automatic gating is explicitly excluded after the user's benchmark showed a deliberate error could still be transcribed as the target.
- Every automatic rule has at least one known competing form.
- No sentence receives more than two micro-checks.
- Local CTC remains Recall-only; Shadow PASS/FAIL uses local delivery metrics + browser carrier checks.

Overall QA: **PASS**.
