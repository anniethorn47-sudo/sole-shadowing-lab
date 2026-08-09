# IELTS SHADOWLAB v4.1 CLOUD — Supabase Setup

This package fixes Supabase's new `sb_secret_...` key handling.

## 1) Supabase SQL

Open your Supabase project and run `supabase-shadowlab.sql` in SQL Editor.

It creates:
- `shadowlab_students`
- `shadowlab_submissions`

## 2) Netlify Environment Variables — REQUIRED

In Netlify → your ShadowLab site → Project configuration → Environment variables:

### SUPABASE_URL

For your current project use:

`https://xxnpmhvcbjntdgasskbn.supabase.co`

You MAY also paste:

`https://xxnpmhvcbjntdgasskbn.supabase.co/rest/v1/`

v4.1 automatically removes `/rest/v1/`, but the base URL is cleaner.

### SUPABASE_SECRET_KEY

Copy the server-side Secret key from THE SAME Supabase project:
Settings → API Keys → Secret keys

It should normally begin:

`sb_secret_...`

Do not add quotes or `SUPABASE_SECRET_KEY =` into the value field.

### SHADOWLAB_TEACHER_PASSWORD

Choose your teacher-dashboard password.

## 3) IMPORTANT FIX IN v4.1

Supabase's new `sb_secret_...` key is not a JWT.

v4 incorrectly sent it as both:
- `apikey: sb_secret_...`
- `Authorization: Bearer sb_secret_...`

v4.1 sends new secret keys only in the `apikey` header.
Legacy JWT `service_role` keys still receive the Bearer header.

## 4) Redeploy

After changing environment variables:
Netlify → Deploys → Trigger deploy / Deploy site.

## 5) Test

Open the student homepage and save a test Name + Class.

Teacher dashboard:
`/teacher.html`

## 6) If it still fails

Do NOT send anyone your full secret key.

Check that:
- SUPABASE_URL project ref is `xxnpmhvcbjntdgasskbn`
- Secret key was copied from that exact project's Settings → API Keys → Secret keys
- Netlify environment variable scopes include Functions/Builds (default "All" is fine)
- you redeployed after changing the environment variables
