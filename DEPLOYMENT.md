# Deployment Guide for Render

This guide walks you through deploying the **AI Study Assistant** full-stack application to [Render](https://render.com/).

---

## Architecture Overview

The repository is configured for **Unified Full-Stack Deployment** (Recommended for Render's free tier):
- A single Render Web Service hosts both the Express API and the compiled React (Vite) frontend.
- When `NODE_ENV=production`, Express serves the React SPA assets from `client/dist` and handles client-side routing fallback (`index.html`).
- All `/api/*` endpoints are handled directly with same-origin requests, eliminating cross-origin cookie/CORS complexities.

*(Separate deployment — Frontend Static Site + Backend Web Service — is also fully supported if preferred).*

---

## Method 1: Deploy with Render Blueprint (Easiest & Recommended)

We have included a `render.yaml` blueprint in the repository root.

1. **Push your code to GitHub/GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically parse `render.yaml` and prompt you to supply the required secret environment variables:
   - `MONGO_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `SARVAM_API_KEY`
   *(Render will automatically generate secure values for `JWT_SECRET` and `JWT_REFRESH_SECRET`).*
6. Click **Apply**. Render will install dependencies, build the frontend bundle, and deploy the service.

---

## Method 2: Manual Web Service Deployment on Render

If you prefer to configure the service manually through Render's UI:

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `ai-study-assistant`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Root Directory**: *(leave blank to use repository root)*
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Add the following **Environment Variables** in the Environment tab:

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode | `production` |
| `MONGO_URI` | MongoDB Atlas Connection String | `mongodb+srv://<user>:<password>@cluster0.abc.mongodb.net/ai_study_assistant?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret for auth tokens | *Any long random secret string* |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | *Any long random secret string* |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Name | From your Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | From your Cloudinary dashboard |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | From your Cloudinary dashboard |
| `SARVAM_API_KEY` | Sarvam AI API Key | From your Sarvam AI dashboard |

5. Click **Create Web Service**.

---

## Important MongoDB Atlas Setup

Because local MongoDB (`mongodb://127.0.0.1:27017`) cannot be reached from Render's cloud servers, you **must** use a cloud database like MongoDB Atlas:

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create or verify a cluster (M0 Free Tier).
3. Under **Security > Database Access**:
   - Create a database user with username & password (avoid special characters like `@` or `:` in the password, or URL-encode them).
4. Under **Security > Network Access**:
   - Add IP Address: `0.0.0.0/0` (Allow Access from Anywhere) so Render's dynamic IPs can connect.
5. Under **Deployment > Database**:
   - Click **Connect** > **Drivers** > Copy the connection string.
   - Replace `<password>` with your database user password and append the database name:
     ```
     mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/ai_study_assistant?retryWrites=true&w=majority
     ```
6. Paste this URI into the `MONGO_URI` environment variable on Render.

---

## Method 3: Separate Deployments (Optional)

If you prefer hosting the React frontend on a **Render Static Site** and the backend on a **Render Web Service**:

### 1. Backend Web Service:
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `MONGO_URI=...`
  - `JWT_SECRET=...`
  - `CLIENT_URL=https://your-frontend-app.onrender.com` (for CORS)
  - Cloudinary and Sarvam keys

### 2. Frontend Static Site:
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL=https://your-backend-app.onrender.com/api`
- **Redirects / Rewrites**:
  - Under **Redirects/Rewrites**:
    - **Source**: `/*`
    - **Destination**: `/index.html`
    - **Action**: `Rewrite` (ensures direct URL navigation works without 404s).
