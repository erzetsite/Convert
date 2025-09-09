# Full-Stack Converter App for Cloudflare

This project is a modern, minimalist file converter website built to run entirely on the Cloudflare ecosystem.

- **Frontend**: A responsive single-page application built with HTML, Tailwind CSS, and vanilla JavaScript. Deployed on **Cloudflare Pages**.
- **Backend**: A RESTful API built with Hono for Express-like routing on Cloudflare Workers. It handles file conversion using pure JavaScript libraries. Deployed on **Cloudflare Workers**.

## Features

- Convert text or uploaded file content into various formats: Word (.docx), Excel (.xlsx), PDF (.pdf), Markdown (.md), and Text (.txt).
- Minimalist, responsive UI with a dark/light theme toggle.
- Pure JavaScript stack, no native binaries or external language dependencies.
- Optimized for easy deployment on Cloudflare.

## Project Structure


/
├── backend/         # Cloudflare Worker (API)
│   ├── src/index.js
│   ├── package.json
│   └── wrangler.toml
├── frontend/        # Cloudflare Pages (Static Site)
│   ├── index.html
│   └── script.js
├── package.json     # Root package for managing the monorepo
└── README.md


## Prerequisites

- Node.js and npm
- A Cloudflare account
- Wrangler CLI installed and configured (`npm install -g wrangler`)

## Setup

1. **Clone the repository**
2. **Install dependencies** for the root and backend projects:
   bash
   npm install
   cd backend
   npm install
   cd ..
   

## Deployment

### 1. Backend (Cloudflare Worker)

1.  Navigate to the `backend` directory.
2.  Update `wrangler.toml` with your Cloudflare `account_id`.
3.  (Optional) If you have a custom domain, configure the `routes` in `wrangler.toml` to match your desired API subdomain (e.g., `api.convert.rzsite.my.id/*`).
4.  Deploy the worker:
    bash
    npm run deploy
    # or from the root directory:
    npm run deploy:backend
    

### 2. Frontend (Cloudflare Pages)

1.  Log in to your Cloudflare dashboard.
2.  Go to **Workers & Pages** > **Create application** > **Pages**.
3.  Connect your Git repository (e.g., GitHub, GitLab).
4.  Select the project repository.
5.  In the build settings:
    -   **Framework preset**: `None`
    -   **Build command**: (leave empty)
    -   **Build output directory**: `frontend`
6.  Deploy the site.
7.  (Optional) Add your custom domain (e.g., `convert.rzsite.my.id`) in the Pages project settings.

Once both are deployed, the frontend application will be able to communicate with the backend API to perform conversions.
