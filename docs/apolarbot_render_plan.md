# ApolarBot Migration Plan (Render)

## 0. Project Briefing
**Objective**: Migrate the existing `ApolarBot` automation from a local machine to a cloud environment (Render) to enable 24/7 availability without local dependencies.
**Current Architecture**: Python script (`main_final.py`) using `Playwright` for browser automation and `Flask` for receiving triggers.
**Target Architecture**: Dockerized Python application running on Render, triggered via webhooks (HTTP POST).

**Key Requirements**:
1.  **Headless Browser**: Must run Chromium in a Docker container.
2.  **Persistent Connectivity**: Must be accessible via public URL for triggers.
3.  **Security**: Environment variables (credentials) must be managed securely on the platform.
- [ ] Create a new GitHub repository: `syg79/apolarbot-render`.
- [ ] Copy `C:\ApolarBot` files to this repository (excluding `.exe`, `venv`, `__pycache__`).
- [ ] Create `requirements.txt` based on `modules` imports.
- [ ] Create `Dockerfile` for Playwright support.

## 2. Dockerfile (Crucial for Playwright)
Render requires a specific Dockerfile to run Playwright (browser) in a headless environment.

\`\`\`dockerfile
FROM python:3.9-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright browsers (and dependencies)
RUN pip install playwright
RUN playwright install --with-deps chromium

WORKDIR /app
COPY . .
RUN pip install -r requirements.txt

# Start command
CMD ["python", "main_final.py"]
\`\`\`

## 3. Render Configuration
- [ ] Sign up/Login to [Render.com](https://render.com).
- [ ] Create "Web Service".
- [ ] Connect GitHub repo.
- [ ] Runtime: **Docker**.
- [ ] Environment Variables: Copy from your local `.env` (TADABASE_*, APOLAR_*, etc.).

## 4. Tadabase Integration (Tadabase -> ApolarBot)
- The bot needs to be triggered.
- If using `flask`, Render provides a URL: `https://apolarbot.onrender.com`.
- In Tadabase, use a Pipe/Script to call: `POST https://apolarbot.onrender.com/trigger` with `{ "referencia": "123456" }`.

## 5. Feasibility Note
- **Cost**: Render has a free tier, but for Playwright/Docker you might need the Starter plan ($7/mo) for reliability (RAM usage).
- **Timeouts**: Render allows longer execution times than Vercel, perfect for scraping.
