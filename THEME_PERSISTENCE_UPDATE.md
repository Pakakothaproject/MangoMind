# Theme Persistence & Color Update

## ✅ Changes Implemented

Updated the light theme to be more yellowish and implemented database persistence for theme preferences.

---

## 🎨 Color Changes

### Light Theme - More Yellowish

**Before (Too White):**
```css
--nb-bg: #fdfbf7;        /* Very light off-white */
--nb-surface: #fff9ed;   /* Soft cream */
--nb-surface-alt: #fef6e8; /* Warm cream */
```

**After (Warm Yellowish):**
```css
--nb-bg: #faf5e6;        /* Warm yellow-beige */
--nb-surface: #fff8e1;   /* Light yellow-cream */
--nb-surface-alt: #fff3d4; /* Golden cream */
```

### Color Comparison

| Element | Before | After | Change |
|---------|--------|-------|--------|
| **Background** | #fdfbf7 | #faf5e6 | More yellow |
| **Surface** | #fff9ed | #fff8e1 | Warmer tone |
| **Surface Alt** | #fef6e8 | #fff3d4 | Golden tint |

### Visual Effect

**Before:**
- Too white/sterile
- Lacked warmth
- Felt clinical

**After:**
- Warm and inviting
- Golden/yellowish tone
- Cozy appearance

---

## 💾 Database Persistence

### Implementation

#### 1. **Updated UserPreferences Type** (`types.ts`)
```typescript
export interface UserPreferences {
    playgroundSidebarModes?: any[];
    chatCollapsedCategories?: Record<string, boolean>;
    defaultSearchModel?: string;
    defaultThinkingModel?: string;
    defaultMultimodalModel?: string;
    theme?: 'light' | 'dark';  // ← New property
}
```

#### 2. **Updated appStore** (`store/appStore.ts`)

**Load Theme from Database:**
```typescript
// In checkUser action - after loading profile
const preferences = profile?.user_preferences as any;
if (preferences?.theme) {
    const savedTheme = preferences.theme as 'light' | 'dark';
    set({ theme: savedTheme });
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(savedTheme);
}
```

**Save Theme to Database:**
```typescript
toggleTheme: async () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    // Save to database if user is logged in
    const { session } = get();
    if (session?.user) {
        try {
            await updateUserPreferences({ theme: newTheme });
            console.log('Theme preference saved to database:', newTheme);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    }
}
```

---

## 🔄 How It Works

### First Time User (Not Logged In)
```
1. App loads
2. Default theme: 'dark'
3. User can toggle to light
4. Theme NOT saved (no account)
```

### Logged In User
```
1. App loads → Default: 'dark'
2. User profile loads
3. Check user_preferences.theme
4. If theme exists → Apply saved theme
5. User toggles theme
6. Save to database immediately
7. Next login → Saved theme applied
```

### Flow Diagram
```
App Init
    ↓
Load Profile
    ↓
Check user_preferences.theme
    ↓
Found? → Apply saved theme
Not Found? → Use default (dark)
    ↓
User toggles theme
    ↓
Update UI immediately
    ↓
Save to database (async)
    ↓
Next session → Loads saved preference
```

---

## 📊 Database Schema

### profiles.user_preferences (JSONB)
```json
{
  "theme": "light",  // or "dark"
  "defaultSearchModel": "perplexity/sonar-pro",
  "defaultThinkingModel": "deepseek/deepseek-r1",
  "defaultMultimodalModel": "google/gemini-2.0-flash",
  "chatCollapsedCategories": {},
  "playgroundSidebarModes": []
}
```

**Storage:**
- Stored in `profiles` table
- Column: `user_preferences` (JSONB)
- Automatically synced across devices
- No migration needed (JSONB is flexible)

---

## 🎯 Default Theme

### Default: Dark Theme

**Why Dark as Default:**
- ✅ Better for long sessions
- ✅ Reduces eye strain
- ✅ Modern aesthetic
- ✅ Saves battery (OLED screens)
- ✅ Professional appearance

**User Can Change:**
- Settings → Appearance → Toggle
- Saved immediately to database
- Persists across sessions
- Syncs across devices

---

## 🎨 Theme Comparison

### Dark Theme (Default)
```
Background: #2a2a2a (dark gray)
Surface: #3a3a3a
Primary: #F8C644 (bright yellow-gold)
Text: #F5F5F5 (white)
```

### Light Theme (New Yellowish)
```
Background: #faf5e6 (warm yellow-beige)
Surface: #fff8e1 (light yellow-cream)
Primary: #d4a574 (golden brown)
Text: #3d3427 (dark brown)
```

---

## 🔧 Files Modified

1. **`index.css`** (lines 7-20)
   - Updated light theme colors
   - Made background more yellowish
   - Warmer surface colors

2. **`types.ts`** (line 99)
   - Added `theme?: 'light' | 'dark'` to UserPreferences

3. **`store/appStore.ts`** (lines 98-104, 182-189, 292-308)
   - Load theme from database on login
   - Save theme to database on toggle
   - Default to dark theme

---

## 💡 Usage

### For Users

**Change Theme:**
1. Go to Settings → Appearance
2. Click "Switch to Light" or "Switch to Dark"
3. Theme changes immediately
4. Preference saved automatically
5. Next login → Same theme applied

**Cross-Device Sync:**
- Login on Device A → Set to Light
- Login on Device B → Automatically Light
- All devices sync via database

### For Developers

**Get Current Theme:**
```typescript
const { theme } = useAppStore();
// 'light' or 'dark'
```

**Toggle Theme:**
```typescript
const { actions: { toggleTheme } } = useAppStore();
await toggleTheme();
```

**Check if Theme is Loaded:**
```typescript
const { profile } = useAppStore();
const hasThemePreference = profile?.user_preferences?.theme;
```

---

## 🧪 Testing

### Test 1: New User
1. Create new account
2. Default theme: Dark ✅
3. Toggle to Light
4. Refresh page
5. Should be Light ✅

### Test 2: Existing User
1. Login with existing account
2. Toggle to Light
3. Logout
4. Login again
5. Should be Light ✅

### Test 3: Cross-Device
1. Login on Device A
2. Set to Light
3. Login on Device B
4. Should be Light ✅

### Test 4: Anonymous User
1. Use app without login
2. Toggle theme
3. Refresh page
4. Back to Dark (not saved) ✅

---

## 🎨 Color Palette

### Light Theme (Yellowish)

**Backgrounds:**
- `#faf5e6` - Main background (warm yellow-beige)
- `#fff8e1` - Cards/panels (light yellow-cream)
- `#fff3d4` - Nested elements (golden cream)

**Accents:**
- `#d4a574` - Primary (golden brown)
- `#b8895f` - Primary hover (darker golden)
- `#e8a84e` - Accent (bright golden)

**Text:**
- `#3d3427` - Main text (dark brown)
- `#8b7d6b` - Secondary text (muted brown)

**Borders:**
- `#e8dcc6` - Soft beige

---

## 📈 Benefits

✅ **Warmer Appearance** - Yellowish tone is more inviting
✅ **Database Persistence** - Theme saved across sessions
✅ **Cross-Device Sync** - Same theme on all devices
✅ **Default Dark** - Better for most users
✅ **Instant Save** - No manual save button needed
✅ **Graceful Fallback** - Works without login

---

## 🔮 Future Enhancements

Potential additions:
- [ ] Auto theme based on time of day
- [ ] Custom theme colors
- [ ] High contrast mode
- [ ] System theme detection
- [ ] Theme preview before applying

---

**Status:** ✅ Fully Implemented
**Light Theme:** More yellowish, less white
**Persistence:** Saved to database
**Default:** Dark theme
**Last Updated:** October 23, 2025
