# Model Gallery Filter Fix 🔧

## Issue Fixed
The chat model gallery was incorrectly showing image generation models (SDXL, Riverflow, Seedream) alongside chat models.

## Changes Made

### 1. **Proper Chat Model Filtering** (`ModelPreferences.tsx`)
Added intelligent filtering to ensure only actual chat/text models appear in the chat tab:

```typescript
// Chat models - filter to only include actual chat/text models
const chatModels = models.filter(model => {
    // Use model_type field first
    if (model.model_type === 'chat' || model.model_type === 'text') return true;
    
    // Exclude if explicitly marked as image or video
    if (model.model_type === 'image' || model.model_type === 'video') return false;
    
    // Fallback: exclude models with image/video generation tags
    const hasImageVideoTags = model.tags?.some(tag => {
        const lowerTag = tag.toLowerCase();
        return lowerTag.includes('image') || lowerTag.includes('video') || 
               lowerTag.includes('upscale') || lowerTag.includes('generation');
    });
    
    // If no model_type is set and no image/video tags, assume it's a chat model
    return !hasImageVideoTags;
});
```

### 2. **Model Count Display**
Added clear display of available models for each category at the top:

```
Chat Models: 45
Image Models: 23
Video Models: 18
```

### 3. **Enhanced Tab Labels**
Updated tab buttons to show both available and selected counts:

**Before:**
- Chat Models (5/10)
- Image Models (3/10)
- Video Models (2/10)

**After:**
- Chat
  - 45 available • 5/10 selected
- Image
  - 23 available • 3/10 selected
- Video
  - 18 available • 2/10 selected

## Filter Logic

### Chat Models ✅
- Models with `model_type === 'chat'` or `model_type === 'text'`
- Models WITHOUT image/video generation tags
- Examples: GPT-4, Claude, Gemini, Llama, etc.

### Image Models 🎨
- Models with `model_type === 'image'`
- Models with image/upscale/generation tags
- Examples: SDXL, Flux, Ideogram, Seedream, etc.

### Video Models 🎬
- Models with `model_type === 'video'`
- Models with video generation tags
- Examples: Sora, Kling, Veo, Wan, etc.

## Benefits

1. ✅ **Accurate Categorization**: Each model appears only in its correct category
2. ✅ **Clear Visibility**: Users can see total available models for each type
3. ✅ **Better UX**: No confusion about which models are for what purpose
4. ✅ **Proper Filtering**: Image/video models no longer pollute chat model list

## Testing

To verify the fix:
1. Open Model Gallery in chat
2. Check "Chat" tab - should only show text/chat models
3. Check "Image" tab - should show SDXL, Flux, Seedream, etc.
4. Check "Video" tab - should show Sora, Kling, Veo, etc.
5. Verify model counts at the top match the actual available models

## Technical Details

- **Filter Priority**: `model_type` field → tag-based filtering → default assumption
- **Tag Exclusion**: Any model with "image", "video", "upscale", or "generation" tags is excluded from chat
- **Backward Compatible**: Works with both new `model_type` field and legacy tag-based systems
- **Performance**: Filtering happens once on load, cached in state

---

**Status**: ✅ Fixed and Ready
**Files Modified**: `components/settings/ModelPreferences.tsx`
