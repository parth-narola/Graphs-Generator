# Deployment Guide

This project is configured for deployment on Vercel with a persistent backend running as serverless functions.

## Prerequisites

1.  **GitHub Account**: You need a GitHub account to host the repository.
2.  **Vercel Account**: You need a Vercel account linked to your GitHub.

## Step 1: Push to GitHub

Since I strongly recommend using the GitHub integration for Vercel, first push your code to a new repository.

1.  Create a new repository on [GitHub](https://github.com/new). Name it `graph-generator` (or similar).
2.  Run the following commands in your terminal (replace `<YOUR_USERNAME>` and `<REPO_NAME>` with your details):

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Vercel

1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import the `graph-generator` repository you just pushed.
4.  In the **Configure Project** step:
    *   **Framework Preset**: Keep as `Vite`.
    *   **Root Directory**: Keep as default (`./`).
    *   **Build & Development Settings**:
        *   **Output Directory**: Change this to `dist/public` (important step!).
    *   **Environment Variables**:
        *   Add `DATABASE_URL` if you have a PostgreSQL database (e.g., from Supabase or Neon).
        *   If you don't add a database URL, the app will use **in-memory storage**, which resets on every deployment/restart.
5.  Click **Deploy**.

## Development Notes

-   **Local Development**: Run `npm run dev` to start the local server on port 5000.
-   **Database**: The current setup uses in-memory storage (`server/storage.ts`). For production, switch to PostgreSQL by ensuring `DATABASE_URL` is set and `server/storage.ts` is updated to use the database implementation (which is already partly configured with Drizzle).
