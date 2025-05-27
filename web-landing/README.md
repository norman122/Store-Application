# StoreApp Landing Pages

This folder contains the web landing pages for StoreApp deep linking.

## Files

- `index.html` - Main landing page for the app
- `product.html` - Product-specific landing page that extracts product ID from URL
- `netlify.toml` - Netlify configuration for routing

## Deployment Options

### Option 1: Netlify (Recommended)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop the `web-landing` folder to Netlify
3. Your site will be live at `https://[random-name].netlify.app`
4. Update the `WEB_BASE_URL` in `src/utils/shareUtils.ts` with your new URL

### Option 2: Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Connect your GitHub repo or upload the folder
3. Deploy and get your URL

### Option 3: GitHub Pages

1. Create a new GitHub repository
2. Upload these files to the repository
3. Enable GitHub Pages in repository settings
4. Your site will be at `https://[username].github.io/[repo-name]`

## How it works

- When someone clicks a shared link like `https://yoursite.com/product/123456`
- The `product.html` page loads
- JavaScript extracts the product ID from the URL
- It tries to open `storeapp://product/123456`
- If the app isn't installed, it redirects to app stores

## Customization

1. Update app store URLs in both HTML files:

   - Replace `id123456789` with your actual App Store ID
   - Replace `com.storeapp` with your actual package name

2. Update the `WEB_BASE_URL` in `src/utils/shareUtils.ts` with your deployed URL

3. Customize the styling and branding in the HTML files
