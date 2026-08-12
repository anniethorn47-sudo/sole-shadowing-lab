IELTS SHADOWLAB v4.6 — MANUAL TARGETS + DEEP LOCAL GRAMMAR

WHAT CHANGED
1. Target chunks
- All 504 main Part 1 routes were reviewed explicitly.
- All 42 extra Work/Study high-school + university route variants were also reviewed explicitly.
- Total: 546 visible answer variants with stored manual target lists.
- No runtime n-gram/automatic chunk extraction is used for Recall targets.
- Target count varies by answer: mostly 3–4 useful lexical bundles; short/simple routes may have 2.

2. Recall grammar
ShadowLab now uses a layered local-only checker:
- High-confidence deterministic learner-error rules (instant).
- Local semantic embeddings for meaning/paraphrase.
- On WebGPU devices, a conservative WebLLM grammar tagger using
  SmolLM2-360M-Instruct-q4f16_1-MLC.
- The deep model is asked for exact transcript spans + minimal replacements only.
- Main-thread safety validation rejects broad rewrites, invented content, and non-exact spans.
- If WebGPU/deep grammar is unavailable, the rule engine still works.

The deep grammar checker NEVER displays a rewritten full answer.

TEST CASE
Input:
I like animal but I never want animal pet because it's hard looking after them and care of them.

The deterministic layer now flags at least:
- like animal → like animals
- want animal pet → want a pet
- it's hard looking → it's hard to look
- care of them → take care of them

IMPORTANT LIMIT
Grammar is checked from the ASR transcript. If speech recognition silently changes an error into correct English, downstream grammar checking cannot recover the exact spoken grammar.

DEPLOY
No new Supabase SQL and no new Netlify environment variables are required.
Replace the current GitHub repo files with this v4.6 package, commit, and let Netlify redeploy.

FILES ADDED/CHANGED
- content.js / embedded content: manual target bank
- practice.html / script_1.js: new Recall grammar logic
- grammar-worker.js: semantic similarity only
- deep-grammar-worker.js: local conservative grammar tagger
- TARGET-CHUNK-AUDIT-v4.6.md: all manual target lists


## v4.7 Teacher Dashboard — student-grouped review

- One row per student account (`student_id`), not one row per completed question.
- Click **View questions** to open that student's practiced questions, then review individual questions inside.
- Combined filters can all be active at the same time: search + multiple classes + multiple students + status + topic + multiple years + multiple months + multiple weeks in month.
- Class matching is case-insensitive; `ielts1`, `IELTS1`, and `Ielts1` are treated as the same class.
- Time filter logic: W1=1–7, W2=8–14, W3=15–21, W4=22–28, W5=29–end.
- Teacher API now paginates completed-question records so grouping does not silently stop at an early PostgREST page.
- No SQL migration is required for v4.7.
