# AgentHive Deployment Guide

## GitHub Pages Deployment

### Prerequisites
- GitHub account
- Node.js 18+ and npm
- Git

### Setup Instructions

1. **Fork the Repository**
   - Click "Fork" at the top-right of the repository page
   - Clone your forked repository:
     ```bash
     git clone https://github.com/yourusername/agenthive.git
     cd agenthive
     ```

2. **Configure GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" in the left sidebar
   - Set source to "GitHub Actions"

3. **Local Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Build and Deploy**
   - Commit and push your changes to trigger the GitHub Action:
     ```bash
     git add .
     git commit -m "Initial commit"
     git push origin main
     ```
   - The GitHub Action will automatically build and deploy your site

5. **Access Your Site**
   - After deployment completes, your site will be available at:
     ```
     https://yourusername.github.io/agenthive
     ```

### Custom Domain (Optional)
1. Add your custom domain to the `frontend/public/CNAME` file
2. Configure DNS settings with your domain registrar
3. In GitHub repository settings, go to Pages and add your custom domain

### Environment Variables
Create a `.env` file in the `frontend` directory with:
```env
VITE_API_URL=https://your-api-url.com
# Add other environment variables as needed
```

### Manual Deployment
If you need to deploy manually:
```bash
cd frontend
npm install
npm run build:gh-pages
npm run deploy:gh-pages
```

### Troubleshooting
- If assets don't load, check the base URL in `vite.config.ts`
- View GitHub Actions logs for build/deployment errors
- Clear browser cache if updates aren't visible
- Ensure all required environment variables are set

## Local Development
```bash
# Start development server
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`
