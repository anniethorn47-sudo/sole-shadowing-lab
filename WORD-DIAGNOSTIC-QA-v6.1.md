# IELTS SHADOWLAB v6.1 — Per-word Diagnostic QA

## Intended behavior
- Hybrid carrier-phrase pronunciation checks remain the only pronunciation gate.
- Local phoneme CTC runs after Shadow Analyze only to produce optional per-word practice diagnostics.
- Reliable content words show `~score/100`; weak or unreliable words show `—`.
- A low estimated word score alone cannot change `pronunciationGate()` or block Continue.
- Clicking a word reveals IPA, detected phones, evidence quality/coverage, and hybrid gate status when available.
- Diagnostic failure degrades to `—` and leaves the hybrid gate untouched.

## Storage
- Saved state version: `v6.1-hybrid-word-diagnostics`.
- Teacher detail includes compact per-word diagnostics plus hybrid evidence.

## Safety principle
The number is a practice estimate, not a certified pronunciation score. The UI labels estimates with `~` and does not invent a numeric value when evidence is not reliable.
