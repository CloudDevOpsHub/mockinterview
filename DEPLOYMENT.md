# Netlify Deployment Guide

## Quick Deploy (Recommended)

### Method 1: Drag & Drop Deploy

1. **Build the project** (already done):
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to https://app.netlify.com/drop
   - Drag and drop the `dist/` folder
   - Your site will be live in seconds!

3. **Configure Environment Variables**:
   - Go to Site settings > Environment variables
   - Add these variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. **Redeploy** after adding environment variables

### Method 2: Git-based Deploy

1. **Push to Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to https://app.netlify.com
   - Click "Add new site" > "Import an existing project"
   - Connect your Git provider
   - Select your repository

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18 or higher

4. **Add Environment Variables**:
   - Go to Site settings > Environment variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **Deploy**: Click "Deploy site"

### Method 3: Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

## Important Configuration

### Environment Variables

Make sure to set these in Netlify:

```
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings.

### Redirects

The `dist/_redirects` file is already configured for client-side routing:

```
/* /index.html 200
```

This ensures all routes work correctly with React Router.

## After Deployment

1. **Create Admin Account**:
   - Visit `your-site.netlify.app/signup`
   - Create your admin account
   - Start using the application

2. **Test Public Leaderboards**:
   - Create a leaderboard in the admin panel
   - Get the public URL
   - Share with students/viewers

## Troubleshooting

### Build Fails
- Make sure Node.js version is 18 or higher
- Check that all dependencies are in `package.json`
- Review build logs for specific errors

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Redeploy after adding/changing variables
- Check Netlify dashboard for correct values

### Routes Return 404
- Verify `_redirects` file exists in `dist/`
- Check that publish directory is set to `dist`

## Application URLs

After deployment, your application will have these routes:

- `/` - Admin dashboard (protected)
- `/login` - Admin login
- `/signup` - Admin signup
- `/public/:publicId` - Public leaderboard view
- `/activeness/:publicId` - Public activeness board view

## Support

For issues with:
- **Deployment**: Check Netlify documentation
- **Database**: Check Supabase documentation
- **Application**: Review the code in this repository
