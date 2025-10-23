# Resource Management System - Implementation Guide

## ✅ Implemented Features

A comprehensive token and storage management system that prevents users from generating content when they have insufficient resources.

## Components Created

### 1. **resourceCheckService.ts**
Core service for checking token and storage availability.

**Key Functions:**
- `checkTokenAvailability(requiredTokens)` - Check if user has enough tokens
- `checkStorageAvailability(requiredBytes)` - Check if user has enough storage
- `checkImageGenerationAvailability(estimatedTokens)` - Combined check for images (5 MB minimum)
- `checkVideoGenerationAvailability(estimatedTokens)` - Combined check for videos (10 MB minimum)
- `formatBytes(bytes)` - Human-readable byte formatting
- `formatTokens(tokens)` - Human-readable token formatting

**Constants:**
- `MIN_IMAGE_STORAGE_BYTES = 5 MB` - Minimum space for image generation
- `MIN_VIDEO_STORAGE_BYTES = 10 MB` - Minimum space for video generation

### 2. **InsufficientResourceModal.tsx**
Beautiful modal component that displays when resources are insufficient.

**Features:**
- Two variants: Tokens and Storage
- Shows current balance/usage
- Shows required amount
- Visual progress bars
- Action buttons:
  - **Tokens Modal**: "Buy More Tokens", "Upgrade Plan"
  - **Storage Modal**: "Delete Old Generations", "Upgrade for More Storage"
- Auto-navigation to relevant settings pages

### 3. **useResourceCheck.ts**
Custom React hook for easy integration in any component.

**Hook Functions:**
- `checkImageGeneration(estimatedTokens?)` - Check before image generation
- `checkVideoGeneration(estimatedTokens?)` - Check before video generation
- `checkTokens(requiredTokens)` - Check tokens only
- `checkStorage(requiredBytes, type)` - Check storage only
- `closeModal()` - Close the modal

**Returns:**
- `showInsufficientModal` - Boolean to show modal
- `insufficientType` - 'tokens' or 'storage'
- `operationType` - 'image', 'video', or 'general'
- `resourceData` - Full resource check result
- `closeModal` - Function to close modal

## Usage Examples

### Example 1: Image Generation Page

```tsx
import React, { useState } from 'react';
import { useResourceCheck } from '../hooks/useResourceCheck';
import InsufficientResourceModal from '../components/InsufficientResourceModal';

const ImageGenerationPage: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    
    const {
        checkImageGeneration,
        showInsufficientModal,
        insufficientType,
        operationType,
        resourceData,
        closeModal,
    } = useResourceCheck();

    const handleGenerate = async () => {
        // Check resources before generation (estimated 100 tokens)
        const canProceed = await checkImageGeneration(100);
        
        if (!canProceed) {
            // Modal will be shown automatically
            return;
        }

        // Proceed with generation
        setLoading(true);
        try {
            // Your image generation logic here
            await generateImage(prompt);
        } catch (error) {
            console.error('Generation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt..."
            />
            <button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Image'}
            </button>

            {/* Resource Modal */}
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
        </div>
    );
};
```

### Example 2: Video Generation Page

```tsx
import React, { useState } from 'react';
import { useResourceCheck } from '../hooks/useResourceCheck';
import InsufficientResourceModal from '../components/InsufficientResourceModal';

const VideoGenPage: React.FC = () => {
    const [videoPrompt, setVideoPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    
    const {
        checkVideoGeneration,
        showInsufficientModal,
        insufficientType,
        operationType,
        resourceData,
        closeModal,
    } = useResourceCheck();

    const handleGenerateVideo = async () => {
        // Check resources before generation (estimated 500 tokens for video)
        const canProceed = await checkVideoGeneration(500);
        
        if (!canProceed) {
            // Modal will be shown automatically
            return;
        }

        // Proceed with video generation
        setGenerating(true);
        try {
            await generateVideo(videoPrompt);
        } catch (error) {
            console.error('Video generation failed:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div>
            <textarea 
                value={videoPrompt} 
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe your video..."
            />
            <button onClick={handleGenerateVideo} disabled={generating}>
                {generating ? 'Generating Video...' : 'Generate Video'}
            </button>

            {/* Resource Modal */}
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
        </div>
    );
};
```

### Example 3: Chat/AI Feature (Tokens Only)

```tsx
import React, { useState } from 'react';
import { useResourceCheck } from '../hooks/useResourceCheck';
import InsufficientResourceModal from '../components/InsufficientResourceModal';

const ChatPage: React.FC = () => {
    const [message, setMessage] = useState('');
    
    const {
        checkTokens,
        showInsufficientModal,
        insufficientType,
        resourceData,
        closeModal,
    } = useResourceCheck();

    const handleSendMessage = async () => {
        // Check if user has at least 50 tokens
        const canProceed = await checkTokens(50);
        
        if (!canProceed) {
            return; // Modal shown automatically
        }

        // Send message
        await sendChatMessage(message);
    };

    return (
        <div>
            <input 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
            />
            <button onClick={handleSendMessage}>Send</button>

            {showInsufficientModal && (
                <InsufficientResourceModal
                    type={insufficientType}
                    operationType="general"
                    onClose={closeModal}
                    tokensNeeded={resourceData?.tokensNeeded}
                    currentTokens={resourceData?.currentTokens}
                />
            )}
        </div>
    );
};
```

### Example 4: Manual Storage Check

```tsx
import { useResourceCheck } from '../hooks/useResourceCheck';
import InsufficientResourceModal from '../components/InsufficientResourceModal';

const CustomFeature: React.FC = () => {
    const {
        checkStorage,
        showInsufficientModal,
        insufficientType,
        resourceData,
        closeModal,
    } = useResourceCheck();

    const handleUploadLargeFile = async (fileSize: number) => {
        // Check if user has enough storage for this file
        const canProceed = await checkStorage(fileSize, 'general');
        
        if (!canProceed) {
            return; // Modal shown automatically
        }

        // Proceed with upload
        await uploadFile();
    };

    return (
        <div>
            {/* Your UI */}
            
            {showInsufficientModal && (
                <InsufficientResourceModal
                    type={insufficientType}
                    operationType="general"
                    onClose={closeModal}
                    storageNeeded={resourceData?.storageNeeded}
                    currentStorage={resourceData?.currentStorage}
                    storageLimit={resourceData?.storageLimit}
                />
            )}
        </div>
    );
};
```

## User Experience Flow

### Scenario 1: Insufficient Tokens for Image Generation

1. User clicks "Generate Image"
2. System checks: `checkImageGeneration(100)`
3. User has 50 tokens, needs 100
4. **Modal appears** showing:
   - Current Balance: 50 tokens
   - Tokens Needed: 50 tokens
   - Progress bar (50% filled)
   - "Buy More Tokens" button → `/settings/tokens`
   - "Upgrade Plan" button → `/settings/subscription`
5. User clicks "Buy More Tokens"
6. Redirected to token purchase page

### Scenario 2: Insufficient Storage for Video Generation

1. User clicks "Generate Video"
2. System checks: `checkVideoGeneration(500)`
3. User has tokens but storage is 195 MB / 200 MB (only 5 MB free, needs 10 MB)
4. **Modal appears** showing:
   - Current Usage: 195 MB
   - Storage Limit: 200 MB
   - Additional Needed: 5 MB
   - Progress bar (97.5% filled, red)
   - "Delete Old Generations" button → `/generations`
   - "Upgrade for More Storage" button → `/settings/subscription`
5. User clicks "Delete Old Generations"
6. Redirected to generations page to manage files

### Scenario 3: Storage Exceeded After Generation

1. User generates multiple images
2. Storage fills up during session
3. Next generation attempt triggers check
4. Modal appears with storage full message
5. User can delete old content or upgrade

## Storage Requirements

| Operation Type | Minimum Space Required |
|---------------|------------------------|
| Image Generation | 5 MB |
| Video Generation | 10 MB |
| General Upload | Variable (checked dynamically) |

## Token Estimates

These are example estimates - adjust based on your actual model costs:

| Operation | Estimated Tokens |
|-----------|-----------------|
| Simple Image | 100 tokens |
| Complex Image | 200 tokens |
| Short Video | 500 tokens |
| Long Video | 1000 tokens |
| Chat Message | 50 tokens |
| AI Analysis | 150 tokens |

## Modal Features

### Tokens Modal
- 🟡 Yellow/Orange gradient theme
- 💰 Coin icon
- Shows current balance and needed amount
- Progress bar visualization
- Two action buttons + cancel

### Storage Modal
- 🔴 Red/Pink gradient theme
- 💾 Database icon
- Shows usage, limit, and additional needed
- Percentage indicator
- Helpful tip about deleting or upgrading
- Two action buttons + cancel

## Integration Checklist

To add resource checking to any generation feature:

- [ ] Import `useResourceCheck` hook
- [ ] Import `InsufficientResourceModal` component
- [ ] Destructure needed functions from hook
- [ ] Call appropriate check function before generation
- [ ] Add modal component to JSX with proper props
- [ ] Handle modal close with `closeModal()`

## Benefits

✅ **Prevents Failed Generations** - Check before attempting
✅ **Clear User Communication** - Beautiful, informative modals
✅ **Guided Actions** - Direct users to solutions
✅ **Consistent UX** - Same experience across all features
✅ **Easy Integration** - Simple hook-based API
✅ **Flexible** - Works for tokens, storage, or both
✅ **Type-Safe** - Full TypeScript support

## Files Created

1. `/services/resourceCheckService.ts` - Core checking logic
2. `/components/InsufficientResourceModal.tsx` - Modal UI component
3. `/hooks/useResourceCheck.ts` - React hook for easy integration

---

**Status:** ✅ Fully Implemented
**Ready for Integration:** Yes
**Last Updated:** October 23, 2025
