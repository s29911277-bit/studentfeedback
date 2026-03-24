# Student Feedback Form (minimal)

This repository contains two minimal demos for a Student Feedback Form:

- A Node/Express demo (if present) — previously created files may exist.
- A Python/Flask demo (added here) which serves the same feedback form and stores submissions to `submissions.json`.

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
- The Flask app exposes `GET /submissions` to review saved feedback (raw JSON).
- Email delivery is supported through Gmail SMTP. Set `FEEDBACK_SMTP_EMAIL` and `FEEDBACK_SMTP_APP_PASSWORD` before running `app.py`.
- If you prefer the Node version instead, run `npm install` and `npm start` in the repository root (only if `package.json` and Node files exist).
- This project is intentionally minimal. Tell me if you'd like a persistent DB (SQLite/Postgres), email notifications, or an admin view.

Gmail setup for feedback delivery

```powershell
$env:FEEDBACK_SMTP_EMAIL='s29911277@gmail.com'
$env:FEEDBACK_SMTP_APP_PASSWORD='your-16-character-gmail-app-password'
python app.py
```

The app sends each submitted feedback entry to `s29911277@gmail.com`.

Publishing a static demo (free, via GitHub Pages)

1. The `docs/` folder contains a static-only version of the site that saves feedback to browser localStorage (no server required). To publish on GitHub Pages:

```powershell
cd 'C:\Users\s2991\OneDrive\Documents\CSS'
git init
git add .
git commit -m "Initial site"
# Create a GitHub repository and follow their instructions to add the remote, e.g.:
# git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

2. In your GitHub repository settings → Pages, set the source to the `main` branch and `/docs` folder. GitHub Pages will publish https://<your-username>.github.io/<repo-name>/

Alternatively you can host the `docs/` folder on Netlify or Vercel (drag-and-drop deploy for a static site).

If you want help creating the GitHub repo and publishing, tell me your GitHub username and repo name (I will only produce the commands for you to run locally).
