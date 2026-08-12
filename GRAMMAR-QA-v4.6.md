# IELTS SHADOWLAB v4.6 — Recall Grammar QA

## Architecture

Recall grammar is no longer based on a full-sentence correction/rewrite.

1. **High-confidence learner-error rules** run instantly.
2. **Deep local grammar** (when WebGPU is available) runs a small in-browser instruct model as an **error tagger**.
3. The deep checker must return:
   - an exact substring from the student's transcript;
   - a minimal replacement;
   - error type and severity.
4. The browser rejects non-exact spans, broad replacements, excessive new vocabulary, and whole-answer rewrites.
5. Grammar is checked from the **ASR transcript**, so an error silently repaired by ASR cannot be recovered later.

## Required regression test

Student transcript:

> I like animal but I never want animal pet because it's hard looking after them and care of them.

The deterministic layer flags:

- `like animal` → `like animals` — generic countable noun
- `want animal pet` → `want a pet` — malformed noun phrase
- `it's hard looking` → `it's hard to look` — adjective + to-infinitive
- `care of them` → `take care of them` — verb pattern

With the deterministic layer alone, this sample is already scored clearly below the acceptable Grammar range. The deep checker may add a new issue only if its span is copied exactly from the transcript and passes the minimal-edit validator.

## Other deterministic regression patterns

- `People is ...` → `People are ...`
- `There are too much information ...` → `There is too much information ...`
- `I enjoy to play ...` → `I enjoy playing ...`
- `I didn't played ...` → `I didn't play ...`
- `I can to speak ...` → `I can speak ...`
- `I like cat` (generic meaning) → `I like cats`
- `It's difficult learning ...` → `It's difficult to learn ...`
- `care of my pet` → `take care of my pet`

Correct answers are not rewritten simply because the model can imagine another way to phrase them.
