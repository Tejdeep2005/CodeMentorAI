# Deployment Guide - Finally-Placed

## Quick Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account (free)
- All environment variables ready

### Environment Variables Needed

**Backend (.env)**
```
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret_key
RAPIDAPI_KEY=your_rapidapi_key
ADZUNA_API_ID=your_adzuna_api_id
ADZUNA_API_KE=your_adzuna_api_key
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
OPENAI_API_KEY=your_openai_api_key
```

### Step 1: Push to GitHub

```bash
cd Finally-Placed
git init
git add .
git commit -m "Initial commit - Add DSA chatbot"
git remote add origin https://github.com/YOUR_USERNAME/Finally-Placed.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Select "Import Git Repository"
4. Choose your Finally-Placed repository
5. Configure project:
   - **Framework Preset**: Node.js
   - **Root Directory**: `backend-Node`
   - **Build Command**: Leave empty (or `npm install`)
   - **Output Directory**: Leave empty
6. Click "Environment Variables" and add all backend variables
7. Click "Deploy"
8. **Save the deployment URL** (e.g., `https://backend-xyz.vercel.app`)

### Step 3: Deploy Frontend to Vercel

1. Click "New Project" again
2. Select the same Finally-Placed repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click "Environment Variables" and add:
   - `VITE_API_URL` = your backend Vercel URL
5. Click "Deploy"
6. **Save the frontend URL** (e.g., `https://frontend-xyz.vercel.app`)

### Step 4: Update CORS in Backend

Update `backend-Node/index.js` to allow your frontend URL:

```javascript
app.use(cors({
  origin: "https://your-frontend-url.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

### Step 5: Verify Deployment

1. Visit your frontend URL
2. Test login functionality
3. Test chatbot (Noupe widget should load)
4. Check browser console for errors

### Troubleshooting

**Frontend shows blank page:**
- Check browser console for errors
- Verify all environment variables are set
- Check CORS settings in backend

**API calls failing:**
- Verify backend URL is correct
- Check CORS configuration
- Verify all backend environment variables

**Chatbot not loading:**
- Noupe script loads from CDN, check internet connection
- Check browser console for script loading errors

### Monitoring

After deployment:
1. Monitor Vercel dashboard for errors
2. Check application logs
3. Set up error tracking (Sentry recommended)

### Rollback

If issues occur:
1. Go to Vercel project
2. Click "Deployments"
3. Select previous working deployment
4. Click "Redeploy"

### Custom Domain (Optional)

1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain
4. Follow DNS configuration steps

---

**Deployment Status**: Ready for production
**Estimated Time**: 15-20 minutes
**Cost**: Free (Vercel free tier)
