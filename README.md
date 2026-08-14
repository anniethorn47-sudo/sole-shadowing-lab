# IELTS SHADOWLAB v4.8 — Simplified Recall

## Main change
Recall no longer scores:
- free-answer meaning
- grammar
- natural wording / collocation

Recall now has ONE gate only:

**Retrieve at least 80% of the manually curated target chunks in one Recall attempt.**

## Recall flow
1. Finish all Shadow sentences and pass the existing Shadow gate.
2. Enter Recall screen.
3. Model answer and target chunks are hidden.
4. Record Recall.
5. Local Whisper transcribes the attempt.
6. ShadowLab checks only the manually curated target chunks.
7. If below 80%, the missing chunks are revealed AFTER the attempt.
8. Press Recall again: the chunks are hidden again before recording.
9. Submit Question stays locked until at least one Recall attempt reaches the 80% gate.

Each Recall attempt is stored separately. Best target-chunk recall is saved to Supabase/Teacher Dashboard.

## Cloud / teacher
Same Supabase and grouped Teacher Dashboard as v4.7.
No SQL migration is required.
No new environment variable is required.

## Deploy
Replace the existing GitHub repository files with this package and commit.
Netlify will redeploy automatically if the repository is connected.
