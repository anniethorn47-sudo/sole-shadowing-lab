# IELTS SHADOWLAB v4 CLOUD — Setup

This build adds real student identity + Supabase submissions + teacher review.

## 1) Supabase
Open the existing Supabase project and run **supabase-shadowlab.sql** in SQL Editor.

The build is prepared for the existing project URL:
`https://scmiknwnisdhcmujkrrp.supabase.co`

It creates two new tables only:
- `shadowlab_students`
- `shadowlab_submissions`

It does NOT modify the existing Writing Tutor tables.

## 2) Netlify environment variables
In the Netlify site: **Site configuration → Environment variables**, add:

- `SUPABASE_SECRET_KEY` = the project's `sb_secret_...` key (or service-role key)
- `SHADOWLAB_TEACHER_PASSWORD` = the password used to open `teacher.html`

Optional:
- `SUPABASE_URL` = `https://scmiknwnisdhcmujkrrp.supabase.co`
  (not required in this package because that project URL is already the fallback)

For compatibility, the function also accepts existing variable names:
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEACHER_PASSWORD`

**Never put the secret key into index.html or any browser file.**

## 3) Deploy
This cloud version contains a **Netlify Function**, so do **not** use the old static-only workflow where you drag only the HTML/assets into the deploy box.

### Recommended: GitHub → Netlify
1. Extract the ZIP.
2. Put the **contents of `IELTS_SHADOWLAB_v4_CLOUD`** at the root of a GitHub repository.
3. In Netlify choose **Add new project → Import an existing project** and select that repository.
4. Build command: leave blank.
5. Publish directory: `.`
6. The included `netlify.toml` points Netlify to `netlify/functions`.
7. Add the environment variables above, then redeploy.

### Alternative
Deploy manually with the Netlify CLI/API so the function is packaged as part of the deploy.

The deployed project must retain this structure:

```
index.html
practice.html
teacher.html
local-asr-worker.js
content.js
hero-bg.png
netlify.toml
netlify/
  functions/
    shadowlab.mjs
```

## 4) Test
1. Open the student site.
2. Enter a test student name and class.
3. Finish one ShadowLab question.
4. The result screen should show: **Submitted · Waiting for teacher review**.
5. Open `/teacher.html` and sign in with `SHADOWLAB_TEACHER_PASSWORD`.
6. The test submission should appear. Click **Review → Accept**.
7. Refresh the student homepage. The question should show **Teacher accepted**.

## Data saved per completed question
- student name + class
- topic / question / selected route
- first and latest Shadow score
- Clarity / Fluency / Rhythm / Connected Speech
- percentage of scored words below 70
- Recall score
- number of analyzed attempts
- local ASR transcript + Recall transcript
- teacher status and note

Audio files are NOT uploaded in v4; pronunciation processing stays local in the browser.
