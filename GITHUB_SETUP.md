# GitHub Setup Guide

This guide will help you push the French Practice app to GitHub and enable GitHub Pages deployment.

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository called `french-practice`
3. Choose **Public** (so GitHub Pages works)
4. Do **NOT** initialize with README (we already have one)
5. Click "Create repository"

## Step 2: Add GitHub Remote and Push

Replace `YOUR_USERNAME` with your actual GitHub username, then run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/french-practice.git
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your repository: `https://github.com/YOUR_USERNAME/french-practice`
2. Click **Settings** (top right)
3. Click **Pages** in the left sidebar
4. Under "Build and deployment":
   - Source: Select "GitHub Actions"
   - (The workflow file will handle deployment automatically)
5. Save

## Step 4: Watch Deployment

1. Go to the **Actions** tab in your repository
2. You should see the "Deploy to GitHub Pages" workflow running
3. Once it completes (green checkmark), your app is live!
4. Your app will be available at: `https://YOUR_USERNAME.github.io/french-practice/`

## What Happens Now

- Every time you push to `main`, the app automatically builds and deploys
- The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles everything
- No manual deployment needed!

## To Update Your App

Just make changes and push:

```bash
git add .
git commit -m "Your message here"
git push
```

The app will automatically redeploy within 1-2 minutes!

## Troubleshooting

**Build failed?**
- Check the Actions tab for error messages
- Make sure all files are committed
- Verify package.json has correct scripts

**Page not updating?**
- Clear your browser cache
- Wait 2 minutes for deployment to complete
- Check Actions tab to see if build succeeded

**Can't see Pages option?**
- Ensure repository is PUBLIC
- Go to Settings → Pages
- Make sure "GitHub Actions" is selected as source

## Local vs Remote

- **Local**: `npm run dev` → runs on `http://localhost:5173`
- **GitHub Pages**: Runs at `https://YOUR_USERNAME.github.io/french-practice/`
- **Base path**: Automatically set to `/french-practice/` in GitHub Pages

Both work perfectly - choose whichever you prefer!

---

That's it! Your French Practice app is now on GitHub and auto-deploys! 🚀
