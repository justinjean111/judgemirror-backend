# Deploy JudgeMirror-backend on Render (baby steps)

## 1) Push to GitHub
- Create a GitHub repo (private or public).
- Commit this backend folder.
- Push.

## 2) Create a new Render Web Service
- New + > Web Service
- Connect your repo
- Root Directory: (leave blank if repo is only backend) OR set to the backend folder path if monorepo.

## 3) Build / Start Commands
Build Command:
npm install && npm run build

Start Command:
npm start

## 4) Environment Variables
OPENAI_API_KEY = your key
OPENAI_MODEL = gpt-4.1-mini   (optional)
PORT = (do NOT set manually; Render provides it automatically)

## 5) Confirm health
After deploy, open:
https://YOUR-SERVICE.onrender.com/health
You should see: {"ok":true}

## 6) Update app backend URL
Open app Settings > Backend URL:
https://YOUR-SERVICE.onrender.com
