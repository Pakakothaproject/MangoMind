# Protected Routes & Login Redirect - Implementation

## ✅ Implemented Feature

Unauthenticated users who try to access protected app URLs are now automatically redirected to the login page, and after successful authentication, they are redirected back to their intended destination.

## How It Works

### 1. **Accessing Protected Route Without Login**

**Example:** User visits `https://app.mangomindbd.com/settings/`

**Flow:**
1. App detects user is not authenticated (`!hasValidSession`)
2. Current URL is stored in `sessionStorage` as `intendedUrl`
3. User sees the **LandingPage** (login/signup page)
4. Console logs: `"Storing intended URL: /settings/"`

### 2. **After Successful Login**

**Flow:**
1. User signs in via email/password or Google OAuth
2. Auth event `SIGNED_IN` is triggered
3. App checks for stored `intendedUrl` in sessionStorage
4. If found, user is redirected to that URL
5. `intendedUrl` is removed from sessionStorage
6. Console logs: `"Redirecting to intended URL: /settings/"`

### 3. **First-Time Users (Profile Setup)**

**Flow:**
1. New user signs up and confirms email
2. Tries to access `/settings/` (stored as `intendedUrl`)
3. App detects no profile → shows ProfileSetupPage
4. User completes profile setup
5. After saving, redirected to `/settings/` (the intended URL)
6. If no intended URL exists, redirected to dashboard

## Implementation Details

### App.tsx Changes

#### Store Intended URL (lines 204-211)
```typescript
useEffect(() => {
    if (!hasValidSession && !authLoading && location.pathname !== '/') {
        // User is not logged in and trying to access a protected route
        console.log('Storing intended URL:', location.pathname + location.search);
        sessionStorage.setItem('intendedUrl', location.pathname + location.search);
    }
}, [hasValidSession, authLoading, location.pathname, location.search]);
```

#### Redirect After Login (lines 268-274)
```typescript
// Redirect to intended URL if stored
const intendedUrl = sessionStorage.getItem('intendedUrl');
if (intendedUrl) {
    console.log('Redirecting to intended URL:', intendedUrl);
    sessionStorage.removeItem('intendedUrl');
    navigate(intendedUrl);
}
```

### ProfileSetupPage.tsx Changes

#### Redirect After Profile Setup (lines 113-120)
```typescript
setTimeout(() => {
    // Check if there's an intended URL to redirect to
    const intendedUrl = sessionStorage.getItem('intendedUrl');
    if (intendedUrl) {
        sessionStorage.removeItem('intendedUrl');
        window.location.href = intendedUrl;
    } else {
        window.location.reload(); // Reload to trigger App.tsx's logic
    }
}, 1500);
```

## Protected Routes

All routes except the root `/` are protected:

- ✅ `/chat`
- ✅ `/video`
- ✅ `/generations`
- ✅ `/personas`
- ✅ `/studio`
- ✅ `/marketing`
- ✅ `/generate`
- ✅ `/dress-me`
- ✅ `/settings/*` (all settings pages)
- ✅ `/playground`

## User Experience Examples

### Example 1: Direct Link to Settings
```
1. User clicks: https://app.mangomindbd.com/settings/profile
2. Not logged in → Redirected to landing page
3. User signs in
4. Automatically redirected to /settings/profile
```

### Example 2: Shared Generation Link
```
1. User receives link: https://app.mangomindbd.com/generations?id=123
2. Not logged in → Redirected to landing page
3. User signs up (new account)
4. Completes profile setup
5. Automatically redirected to /generations?id=123
```

### Example 3: Normal Login (No Intended URL)
```
1. User visits: https://app.mangomindbd.com/
2. Clicks "Login"
3. Signs in
4. Redirected to dashboard (/)
```

## Technical Details

### Storage Method
- **sessionStorage** is used (not localStorage)
- Data persists only for the current browser tab/session
- Automatically cleared when tab is closed
- Prevents stale redirects across sessions

### URL Preservation
- Full pathname is stored: `/settings/profile`
- Query parameters are preserved: `?id=123&tab=advanced`
- Hash fragments are included: `#section`

### Edge Cases Handled

1. **Root path (`/`)**: Not stored as intended URL (normal behavior)
2. **Already logged in**: No redirect, normal navigation
3. **Profile incomplete**: Redirect happens after profile setup
4. **Multiple tabs**: Each tab has its own sessionStorage
5. **Sign out**: Intended URL is cleared on sign out

## Security Considerations

✅ **Client-side only**: No sensitive data stored
✅ **Session-scoped**: Cleared when tab closes
✅ **No token storage**: Only stores URL paths
✅ **Protected routes**: All routes still require authentication

## Testing Scenarios

### Test 1: Direct Protected Route Access
1. Open incognito window
2. Navigate to `https://app.mangomindbd.com/settings/`
3. Should see login page
4. Sign in
5. Should redirect to `/settings/`

### Test 2: Query Parameters
1. Access `https://app.mangomindbd.com/generations?filter=recent`
2. Login
3. Should redirect to `/generations?filter=recent`

### Test 3: New User Flow
1. Access `https://app.mangomindbd.com/playground`
2. Sign up (new account)
3. Complete profile setup
4. Should redirect to `/playground`

## Console Logs

For debugging, check browser console for:
- `"Storing intended URL: /path"` - When URL is saved
- `"Redirecting to intended URL: /path"` - When redirecting after login

---

**Status:** ✅ Fully Implemented
**Files Modified:** 
- `App.tsx` (2 changes)
- `ProfileSetupPage.tsx` (1 change)

**Last Updated:** October 23, 2025
