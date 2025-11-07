# Deployment Headers Fix

## Problem Fixed
The application was showing:
- `Origin: undefined` 
- `Content-Type: undefined`
- `Authorization: Not present`

This occurred because:
1. When frontend and backend are on the same domain, browsers don't send the `Origin` header (this is normal for same-origin requests)
2. The API base URL was defaulting to `http://localhost:5000` in production
3. Axios wasn't consistently setting headers and Authorization tokens

## Changes Made

### 1. Frontend API Configuration (`client/src/services/api.ts`)
- **Fixed API Base URL**: Changed from `http://localhost:5000` to empty string (relative path) when `REACT_APP_API_URL` is not set
- **Added Request Interceptor**: Automatically adds:
  - Authorization token from localStorage on every request
  - Content-Type header for JSON requests
  - Properly handles FormData (removes Content-Type to let browser set it with boundary)
- **Added Response Interceptor**: Handles 401 errors and redirects to login
- **Set Default Headers**: Content-Type and Accept headers are set by default

### 2. Backend CORS Configuration (`server.js`)
- **Improved Same-Origin Handling**: Properly handles requests without Origin header (same-origin requests)
- **Simplified CORS Logic**: Allows same-origin requests when `FRONTEND_URL` is not set in production
- **Reduced Logging**: Only logs request details in development or when `DEBUG=true`

## Environment Variables

### For Production Deployment

#### Option 1: Same-Origin (Frontend and Backend on Same Domain) - **RECOMMENDED**
**No environment variables needed!** The application will work automatically when frontend and backend are served from the same domain.

The frontend will use relative paths (`/api/...`) and the backend will accept same-origin requests.

#### Option 2: Different Origins (Frontend and Backend on Different Domains)
If your frontend and backend are on different domains, set:

**Backend (.env or environment variables):**
```bash
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

**Frontend (.env or build-time environment variables):**
```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

### Optional Environment Variables

**Backend:**
- `DEBUG=true` - Enable detailed request logging in production (default: false)
- `NODE_ENV=production` - Set to production mode
- `PORT=5000` - Server port (default: 5000)

**Frontend:**
- `REACT_APP_API_URL` - Only needed if frontend and backend are on different domains

## How It Works Now

1. **Same-Origin Requests** (Frontend and Backend on Same Domain):
   - Frontend makes requests to `/api/...` (relative paths)
   - Browser doesn't send `Origin` header (normal behavior)
   - Backend accepts requests without Origin header
   - Authorization token is automatically included from localStorage
   - Content-Type is automatically set for JSON requests

2. **Cross-Origin Requests** (Different Domains):
   - Set `REACT_APP_API_URL` to backend URL
   - Set `FRONTEND_URL` to frontend URL on backend
   - CORS will handle preflight requests properly

## Testing

After deployment, verify:
1. ✅ API requests include `Authorization` header when user is logged in
2. ✅ API requests include `Content-Type: application/json` for JSON requests
3. ✅ File uploads work correctly (FormData)
4. ✅ No CORS errors in browser console
5. ✅ Same-origin requests work without Origin header

## Notes

- The `Origin: undefined` message is **normal** for same-origin requests - browsers don't send Origin header for same-origin requests
- The logging middleware now only shows detailed logs in development or when `DEBUG=true`
- All API requests automatically include the Authorization token if available in localStorage
- The interceptor ensures headers are always set correctly, even if individual API calls forget to set them

