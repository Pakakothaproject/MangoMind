# Chat Error Debugging - 400 Error Fix

## 🐛 Issue: Chat API Returning 400 Error

The chat function is failing with a 400 error from the AIMLAPI endpoint.

---

## 📊 Error Details

### **Error Message:**
```
Failed to load resource: the server responded with a status of 400
AIMLAPI chat streaming error: Error: [object Object]
at getChatCompletion (chatService.ts:59:19)
```

### **Problem:**
The error logging was showing `[object Object]` instead of the actual error message, making it impossible to debug.

---

## ✅ Fix Applied

### **Improved Error Logging**

Updated `chatService.ts` to show detailed error information:

**Before:**
```typescript
if (!response.ok) {
    let errorMsg = `API error: ${response.statusText}`;
    try { 
        const errorData = await response.json(); 
        errorMsg = errorData.error || errorData.message || errorMsg; 
    } catch (e) { /* ignore */ }
    throw new Error(errorMsg);
}
```

**After:**
```typescript
if (!response.ok) {
    let errorMsg = `API error: ${response.status} ${response.statusText}`;
    let errorDetails: any = {};
    try { 
        errorDetails = await response.json(); 
        console.error('AIMLAPI error response:', errorDetails);
        errorMsg = errorDetails.error || errorDetails.message || JSON.stringify(errorDetails) || errorMsg; 
    } catch (e) { 
        console.error('Could not parse error response:', e);
    }
    console.error('Full error:', errorMsg);
    throw new Error(errorMsg);
}
```

**Improvements:**
1. ✅ Shows **HTTP status code** (400, 401, 403, etc.)
2. ✅ Logs **full error response** from API
3. ✅ Shows **stringified JSON** if no error/message field
4. ✅ Catches **parse errors** separately

### **Enhanced Catch Block**

**Before:**
```typescript
} catch (error) {
    console.error('AIMLAPI chat streaming error:', error);
    throw error;
}
```

**After:**
```typescript
} catch (error) {
    console.error('AIMLAPI chat streaming error:', error);
    console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error: error
    });
    throw error;
}
```

**Improvements:**
1. ✅ Shows **error message**
2. ✅ Shows **stack trace**
3. ✅ Shows **full error object**

---

## 🔍 Next Steps to Debug

### **1. Check Console for Detailed Error**

Now when you try to send a message, the console will show:

```javascript
AIMLAPI error response: {
  error: "Actual error message here",
  details: { ... }
}
Full error: Actual error message here
```

### **2. Common 400 Error Causes**

| Cause | Solution |
|-------|----------|
| **Invalid model** | Check if model ID is correct |
| **No access to model** | User doesn't have permission |
| **Invalid message format** | Check message structure |
| **Missing required fields** | Ensure all required params sent |
| **Rate limit** | User exceeded API limits |
| **Insufficient tokens** | User ran out of tokens |

### **3. Check the Request**

Add this before the fetch to see what's being sent:

```typescript
console.log('Sending chat request:', {
    model,
    messages,
    stream: true
});
```

---

## 🧪 Testing the Fix

### **1. Try Sending a Message**

The error will now show detailed information like:

```
AIMLAPI error response: {
  error: "Model 'invalid-model' not found",
  code: "model_not_found"
}
Full error: Model 'invalid-model' not found
```

Instead of:
```
Error: [object Object]  ← Useless!
```

### **2. Check Error Stack**

```
Error details: {
  message: "Model 'invalid-model' not found",
  stack: "Error: Model 'invalid-model' not found\n    at getChatCompletion...",
  error: Error: Model 'invalid-model' not found
}
```

---

## 🎯 Likely Issues

Based on the error appearing right after sending a message, the 400 error is likely caused by:

### **1. Model Not Accessible ⭐ Most Likely**

The model being sent might not be in the user's accessible models list.

**Check:**
```javascript
// In console after models load:
console.log('Accessible models:', models.filter(m => m.is_accessible));
```

**Fix:**
Ensure only accessible models are sent to the API.

### **2. Invalid Model Format**

Model ID format might be wrong.

**Check:**
```javascript
// Should be something like:
"google/gemini-2.5-flash"
// Not:
"gemini-2.5-flash"
```

### **3. Message Format Issue**

Messages might not be in the correct format.

**Expected:**
```javascript
{
  role: "user" | "assistant" | "system",
  content: "message text"
}
```

### **4. Token Balance**

User might be out of tokens.

**Check:**
```javascript
console.log('Token balance:', profile.token_balance);
```

---

## 📁 File Modified

### **`services/chatService.ts`**

**Lines 56-68:** Enhanced error logging
```typescript
if (!response.ok) {
    let errorMsg = `API error: ${response.status} ${response.statusText}`;
    let errorDetails: any = {};
    try { 
        errorDetails = await response.json(); 
        console.error('AIMLAPI error response:', errorDetails);
        errorMsg = errorDetails.error || errorDetails.message || JSON.stringify(errorDetails) || errorMsg; 
    } catch (e) { 
        console.error('Could not parse error response:', e);
    }
    console.error('Full error:', errorMsg);
    throw new Error(errorMsg);
}
```

**Lines 131-139:** Enhanced catch block logging
```typescript
} catch (error) {
    console.error('AIMLAPI chat streaming error:', error);
    console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error: error
    });
    throw error;
}
```

---

## 🔧 How to Use This

1. **Try sending a chat message**
2. **Open browser console** (F12)
3. **Look for the detailed error logs**:
   - `AIMLAPI error response:` - Shows API error
   - `Full error:` - Shows formatted error message
   - `Error details:` - Shows complete error object

4. **Based on the error**, fix the issue:
   - Model not found → Use a different model
   - No access → Check user permissions
   - Invalid format → Fix message structure
   - No tokens → User needs to buy tokens

---

## ✅ Result

Now you'll see **meaningful error messages** instead of `[object Object]`, making it possible to actually debug and fix the issue!

**Example good error:**
```
AIMLAPI error response: {
  error: "Insufficient tokens. Required: 1000, Available: 0"
}
Full error: Insufficient tokens. Required: 1000, Available: 0
```

---

**Status:** ✅ Error Logging Improved
**Next:** Check console for actual error details
**Debugging:** Now possible with detailed logs
**Last Updated:** October 24, 2025
