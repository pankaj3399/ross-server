# MaturAIze Deployment Guide

## Vercel Deployment

### Frontend Deployment (Next.js)

1. **Prepare the Frontend**

   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Select the `frontend` folder as the root directory
   - Set the framework to "Next.js" (auto-detected)

3. **Environment Variables**
   Set these in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://your-backend.vercel.app`)

### Backend Deployment (Vercel)

You can deploy the Node/Express backend on Vercel using the Node.js runtime.

1. In Vercel, create a new Project and select the repository
2. Set the Root Directory to `backend`
3. Framework Preset: "Other"
4. Build & Output:
   - Build Command: `npm run build` (or leave empty if not building)
   - Output Directory: `.` (not used for Node server)
   - Install Command: `npm install`
   - Development Command: `npm run dev` (local only)
5. Set Environment Variables:

   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `PORT`: `4000` (Vercel provides `PORT`; ensure the app reads from `process.env.PORT`)

6. Ensure your `backend/src/index.ts` listens on `process.env.PORT || 4000`
7. Redeploy

### Database Setup

1. **Neon PostgreSQL**

   - Go to [neon.tech](https://neon.tech)
   - Create a new database
   - Copy the connection string
   - Use as `DATABASE_URL` in your backend

2. **Database Schema**
   The backend will automatically create tables on first run.

### Environment Variables

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

#### Backend (.env)

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=4000
```

### Deployment Steps

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy Frontend**

   - Connect Vercel to your GitHub repo
   - Deploy the `frontend` folder

3. **Deploy Backend**

   - Deploy to Vercel (Root: `backend`)
   - Set environment variables
   - Get the backend URL

4. **Update Frontend Environment**

   - Update `NEXT_PUBLIC_API_URL` in Vercel
   - Redeploy frontend

5. **Test Deployment**

   - Visit your Vercel frontend URL
   - Test login/registration
   - Test assessment flow

### Custom Domain (Optional)

1. **Frontend Domain**

   - In Vercel dashboard, go to Settings > Domains
   - Add your custom domain
   - Update DNS records

2. **Backend Domain**

   - Configure custom domain in Vercel for the backend project
   - Update `NEXT_PUBLIC_API_URL` in the frontend (Vercel)

### Monitoring

1. **Vercel Analytics**

   - Enable in Vercel dashboard
   - Monitor performance and usage

2. **Backend Logs**

   - Use Vercel Logs for the backend project
   - Monitor database connections

### Troubleshooting

1. **CORS Issues**

   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check CORS configuration

2. **Database Connection**

   - Verify `DATABASE_URL` is correct
   - Check database is accessible from hosting service

3. **Environment Variables**

   - Ensure all required variables are set
   - Check variable names match exactly

### Production Checklist

- [ ] Environment variables configured
- [ ] Database schema created
- [ ] CORS properly configured
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Backup strategy in place
