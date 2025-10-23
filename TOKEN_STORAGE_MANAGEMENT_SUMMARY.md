# Token & Storage Management System - Complete Summary

## ✅ Fully Implemented Solution

A comprehensive resource management system that prevents users from generating content when they have insufficient tokens or storage space.

---

## 🎯 Requirements Addressed

### 1. **Insufficient Tokens**
✅ User is prompted to buy tokens or upgrade plan
✅ Beautiful modal with current balance and needed amount
✅ Direct navigation to token purchase or subscription page

### 2. **Storage Exceeded**
✅ User is prompted to delete old content or upgrade
✅ Shows current usage, limit, and space needed
✅ Direct navigation to generations page or subscription page

### 3. **Pre-Generation Checks**
✅ **Images**: Minimum 5 MB space required
✅ **Videos**: Minimum 10 MB space required
✅ Checks both tokens AND storage before generation

---

## 📦 Files Created

### 1. **Core Service** - `services/resourceCheckService.ts`
```typescript
// Key functions:
checkImageGenerationAvailability(estimatedTokens)
checkVideoGenerationAvailability(estimatedTokens)
checkTokenAvailability(requiredTokens)
checkStorageAvailability(requiredBytes)
formatBytes(bytes)
formatTokens(tokens)

// Constants:
MIN_IMAGE_STORAGE_BYTES = 5 MB
MIN_VIDEO_STORAGE_BYTES = 10 MB
```

### 2. **UI Component** - `components/InsufficientResourceModal.tsx`
- Beautiful modal with two variants (Tokens/Storage)
- Shows current balance/usage with progress bars
- Action buttons for buying tokens, upgrading, or deleting content
- Auto-navigation to relevant pages

### 3. **React Hook** - `hooks/useResourceCheck.ts`
```typescript
const {
    checkImageGeneration,      // Check before image generation
    checkVideoGeneration,       // Check before video generation
    checkTokens,                // Check tokens only
    checkStorage,               // Check storage only
    showInsufficientModal,      // Modal visibility state
    insufficientType,           // 'tokens' or 'storage'
    operationType,              // 'image', 'video', or 'general'
    resourceData,               // Full check result
    closeModal,                 // Close modal function
} = useResourceCheck();
```

---

## 🚀 Quick Integration (5 Steps)

### Step 1: Import
```typescript
import { useResourceCheck } from '../hooks/useResourceCheck';
import InsufficientResourceModal from '../components/InsufficientResourceModal';
```

### Step 2: Initialize Hook
```typescript
const {
    checkImageGeneration,
    showInsufficientModal,
    insufficientType,
    operationType,
    resourceData,
    closeModal,
} = useResourceCheck();
```

### Step 3: Create Wrapper Function
```typescript
const handleGenerateWithCheck = async () => {
    const estimatedTokens = numberOfImages * 100;
    const canProceed = await checkImageGeneration(estimatedTokens);
    
    if (!canProceed) {
        return; // Modal shown automatically
    }
    
    generate(session?.user?.id);
};
```

### Step 4: Update Button
```typescript
<button onClick={handleGenerateWithCheck} disabled={isLoading || !prompt}>
    Generate
</button>
```

### Step 5: Add Modal
```typescript
{showInsufficientModal && (
    <InsufficientResourceModal
        type={insufficientType}
        operationType={operationType}
        onClose={closeModal}
        tokensNeeded={resourceData?.tokensNeeded}
        currentTokens={resourceData?.currentTokens}
        storageNeeded={resourceData?.storageNeeded}
        currentStorage={resourceData?.currentStorage}
        storageLimit={resourceData?.storageLimit}
    />
)}
```

---

## 💡 Usage Examples

### Image Generation
```typescript
const canProceed = await checkImageGeneration(100);
if (!canProceed) return;
// Proceed with generation
```

### Video Generation
```typescript
const canProceed = await checkVideoGeneration(500);
if (!canProceed) return;
// Proceed with generation
```

### Chat/AI Features (Tokens Only)
```typescript
const canProceed = await checkTokens(50);
if (!canProceed) return;
// Send message
```

### Custom Storage Check
```typescript
const canProceed = await checkStorage(fileSize, 'general');
if (!canProceed) return;
// Upload file
```

---

## 🎨 User Experience

### Scenario 1: Insufficient Tokens
```
User clicks "Generate Image"
    ↓
System checks resources
    ↓
User has 50 tokens, needs 100
    ↓
🟡 MODAL APPEARS:
   "Insufficient Tokens"
   Current: 50 tokens
   Needed: 50 more tokens
   [Buy More Tokens] → /settings/tokens
   [Upgrade Plan] → /settings/subscription
```

### Scenario 2: Storage Full
```
User clicks "Generate Video"
    ↓
System checks resources
    ↓
User has 195 MB / 200 MB (needs 10 MB free)
    ↓
🔴 MODAL APPEARS:
   "Storage Full"
   Usage: 195 MB / 200 MB (97.5%)
   Needed: 5 MB more
   [Delete Old Generations] → /generations
   [Upgrade for More Storage] → /settings/subscription
```

### Scenario 3: Both Sufficient
```
User clicks "Generate"
    ↓
System checks resources
    ↓
✅ Tokens: Sufficient
✅ Storage: Sufficient
    ↓
Generation proceeds normally
```

---

## 📊 Storage Requirements

| Operation | Minimum Space |
|-----------|---------------|
| Image Generation | 5 MB |
| Video Generation | 10 MB |
| Custom Operation | Variable |

## 💰 Token Estimates (Examples)

| Operation | Estimated Tokens |
|-----------|-----------------|
| Simple Image | 100 |
| Complex Image | 200 |
| Short Video | 500 |
| Long Video | 1000 |
| Chat Message | 50 |

*Adjust these based on your actual model costs*

---

## 🎯 Modal Features

### Tokens Modal (Yellow/Orange Theme)
- 💰 Coin icon
- Current balance display
- Tokens needed display
- Progress bar visualization
- "Buy More Tokens" button
- "Upgrade Plan" button
- Cancel option

### Storage Modal (Red/Pink Theme)
- 💾 Database icon
- Current usage display
- Storage limit display
- Additional space needed
- Percentage indicator
- Helpful tip
- "Delete Old Generations" button
- "Upgrade for More Storage" button
- Cancel option

---

## 🔄 Integration Points

### Where to Add Checks:

1. **Image Generation Page** ✅
   - Before calling image generation API
   - Check: `checkImageGeneration(estimatedTokens)`

2. **Video Generation Page** ✅
   - Before calling video generation API
   - Check: `checkVideoGeneration(estimatedTokens)`

3. **Studio Page** (Try-on, Hairstyle, Scene Swap)
   - Before processing images
   - Check: `checkImageGeneration(estimatedTokens)`

4. **Marketing Page**
   - Before generating marketing content
   - Check: `checkImageGeneration(estimatedTokens)`

5. **Chat Page** (if using tokens)
   - Before sending messages
   - Check: `checkTokens(estimatedTokens)`

6. **Playground Page**
   - Before any AI operations
   - Check: `checkTokens(estimatedTokens)`

---

## ✨ Benefits

✅ **Prevents Failed Operations** - Check before attempting
✅ **Clear Communication** - Users know exactly what's wrong
✅ **Guided Solutions** - Direct users to fix the issue
✅ **Consistent UX** - Same experience everywhere
✅ **Easy to Use** - Simple hook-based API
✅ **Flexible** - Works for any resource type
✅ **Type-Safe** - Full TypeScript support
✅ **Beautiful UI** - Modern, professional modals
✅ **Smart Navigation** - Auto-redirect to relevant pages

---

## 🛠️ Technical Details

### Storage Calculation
- Uses `getTotalStorageUsage()` from `generationService.ts`
- Sums all generation sizes in bytes
- Compares against user's `storage_limit_bytes` from profile
- Accounts for estimated new generation size

### Token Checking
- Fetches current `token_balance` from profiles table
- Compares against estimated token cost
- Returns deficit if insufficient

### Resource Check Result
```typescript
interface ResourceCheckResult {
    canProceed: boolean;
    reason?: 'insufficient_tokens' | 'insufficient_storage' | 'ok';
    tokensNeeded?: number;
    storageNeeded?: number;
    currentTokens?: number;
    currentStorage?: number;
    storageLimit?: number;
}
```

---

## 📝 Documentation Files

1. **RESOURCE_MANAGEMENT_IMPLEMENTATION.md** - Full implementation guide
2. **INTEGRATION_EXAMPLE.tsx** - Complete working example
3. **TOKEN_STORAGE_MANAGEMENT_SUMMARY.md** - This file

---

## 🎓 Best Practices

1. **Always check before generation** - Never attempt without checking
2. **Use appropriate estimates** - Be realistic about token costs
3. **Handle edge cases** - User might close modal and retry
4. **Update storage after operations** - Keep usage in sync
5. **Test both scenarios** - Test insufficient tokens AND storage
6. **Provide clear messaging** - Users should understand the issue
7. **Offer solutions** - Always give users a path forward

---

## 🔍 Testing Checklist

- [ ] Test with insufficient tokens
- [ ] Test with insufficient storage
- [ ] Test with both sufficient
- [ ] Test modal close and retry
- [ ] Test "Buy Tokens" navigation
- [ ] Test "Upgrade Plan" navigation
- [ ] Test "Delete Generations" navigation
- [ ] Test with different operation types (image/video)
- [ ] Test progress bar visualization
- [ ] Test on mobile devices
- [ ] Test with edge case values (0 tokens, full storage)

---

## 🚀 Next Steps

1. **Integrate into Image Generation Page**
   - Add the 5 steps from integration example
   - Test thoroughly

2. **Integrate into Video Generation Page**
   - Same process, use `checkVideoGeneration()`
   - Higher token estimates

3. **Add to Other Features**
   - Studio, Marketing, Chat, Playground
   - Use appropriate check functions

4. **Configure Token Estimates**
   - Adjust based on actual model costs
   - Consider different model tiers

5. **Monitor Usage**
   - Track how often modals appear
   - Adjust thresholds if needed

---

**Status:** ✅ Fully Implemented and Ready for Integration
**Last Updated:** October 23, 2025
**Files Created:** 3 core files + 3 documentation files
