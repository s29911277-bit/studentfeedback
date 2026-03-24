# Student Feedback Form (minimal)

This repository contains two minimal demos for a Student Feedback Form:

- A Node/Express demo (if present) - previously created files may exist.
- A Python/Flask demo which serves the same feedback form and stores submissions to `submissions.json` or PostgreSQL.

How to run the Python/Flask app (PowerShell on Windows):

```powershell
cd 'C:\Users\s2991\OneDrive\Documents\CSS'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
# open http://127.0.0.1:5000 in your browser
```

Notes:
- The Flask app exposes `GET /submissions` to review saved feedback.
- PostgreSQL is supported when `DATABASE_URL` is set.
- Without `DATABASE_URL`, the app falls back to `submissions.json`.
- If you prefer the Node version instead, run `npm install` and `npm start` in the repository root only if `package.json` and Node files exist.

PostgreSQL setup:

```powershell
$env:DATABASE_URL='postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME'
python app.py
```

When `DATABASE_URL` is present, the app creates a `feedback_submissions` table automatically and stores new submissions there.

Publishing a static demo (free, via GitHub Pages):

1. The `docs/` folder contains a static-only version of the site that saves feedback to browser localStorage.
2. In your GitHub repository settings, enable Pages from the `main` branch and `/docs` folder.

Alternatively, you can host the `docs/` folder on Netlify, Vercel, or Cloudflare Pages as a static site.
