# 🔧 Fix: Practice Generation Error

## Problem
Users see the error message: **"فشل في إنشاء الأسئلة. يرجى المحاولة مرة أخرى."** when trying to generate practice questions.

## Root Cause
The `ANTHROPIC_API_KEY` in your `.env.local` file is **invalid or expired**.

## Solution

### Step 1: Get a Valid Anthropic API Key

1. Visit the Anthropic Console: https://console.anthropic.com/settings/keys
2. Log in to your account
3. Click "Create Key" or select an existing valid key
4. Copy the new API key (it should start with `sk-ant-api03-`)

### Step 2: Update Your `.env.local` File

1. Open `.env.local` in your project root
2. Find the line that says:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
3. Replace the old key with your new key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-YOUR_NEW_KEY_HERE
   ```
4. Save the file

### Step 3: Restart the Development Server

1. Stop the current development server (press `Ctrl+C` in the terminal)
2. Restart it:
   ```bash
   npm run dev
   ```
3. You should see this message on startup:
   ```
   ✅ ANTHROPIC_API_KEY validation: OK
   ```

### Step 4: Test Practice Generation

1. Navigate to `/practice/new` in your browser
2. Select practice settings
3. Click "ابدأ التمرين" (Start Practice)
4. Questions should generate successfully

## Verification

If the API key is valid, you'll see:
- ✅ No errors during practice generation
- ✅ Green checkmark on server startup
- ✅ Questions load correctly

If the API key is still invalid:
- ❌ Red error message on server startup
- ❌ Error: "خطأ في إعدادات النظام. يرجى التواصل مع الدعم الفني."

## Additional Notes

### API Key Format
- Must start with: `sk-ant-api03-`
- Typical length: 100+ characters
- Example: `sk-ant-api03-abcdef1234567890...`

### Common Issues

**Issue**: "Key not found"
- **Fix**: Make sure the key is in `.env.local` (not `.env` or `.env.production`)

**Issue**: "Still getting errors after updating"
- **Fix**: Restart the development server completely

**Issue**: "Key is too short"
- **Fix**: Make sure you copied the entire key from Anthropic Console

### Testing Endpoint

You can test the API key directly by visiting:
```
http://localhost:3003/api/test-generation
```

This will return:
- ✅ Success if the key works
- ❌ Error details if the key doesn't work

## Changes Made

The following improvements were added to provide better error handling:

1. **API Key Validation Utility** (`src/lib/api-key-validator.ts`)
   - Validates API key format on startup
   - Provides helpful error messages

2. **Enhanced Error Messages**
   - Practice generation now shows clear error for API key issues
   - Exam generation also updated with better errors

3. **Startup Validation**
   - API key is validated when the server starts
   - Errors are logged to the console

4. **Diagnostic Endpoint**
   - `/api/test-generation` for testing question generation
   - Returns detailed error information

## Need Help?

If you continue to experience issues:
1. Check server logs for detailed error messages
2. Verify your API key at: https://console.anthropic.com/settings/keys
3. Contact Anthropic support if your key isn't working: https://support.anthropic.com
