# IELTS SHADOWLAB v5.0 — Deployment / Supabase Notes

## Existing ShadowLab deployment
If v4.9.1 is already connected to Supabase successfully, **do not run a new SQL migration for v5.0**.

v5.0 reuses the existing tables:
- `shadowlab_students`
- `shadowlab_submissions`

The new active-time and recording-integrity data is stored inside the existing `detail_json` column.

## Netlify environment variables
Keep the same three variables that already work:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SHADOWLAB_TEACHER_PASSWORD`

No new environment variable is required for the mobile phoneme engine. The phoneme model runs in the student's browser.

## Deploy
Replace the repository files with the v5.0 package, commit, and let Netlify deploy again.

After deployment test:
1. Student home → achievement dashboard loads.
2. Select a topic from the left column → questions appear on the right.
3. Make one valid Shadow recording and run Analyze on desktop and phone.
4. Switch app/tab during a recording → that recording must be rejected.
5. Switch app/tab while the question timer is running → active time must pause.
6. Finish Recall at >=80% target chunks and submit.
7. Teacher Dashboard → open that student → verify active time and valid/rejected recording evidence.

## Secret-key handling
The Netlify Function keeps the existing safe handling for Supabase `sb_secret_...` server-side keys. Never place the secret key in browser HTML/JavaScript.
