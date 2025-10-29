# Token Usage Tracking & Limitation System

## 🎯 Overview

A comprehensive token consumption tracking and limitation system that monitors AI usage per user and enforces limits based on subscription tiers.

## 🏗️ Architecture

### 1. **User Model Enhancements** (`models/User.js`)
- **Token Usage Tracking**: `totalTokensUsed`, `monthlyTokensUsed`, `dailyTokensUsed`
- **Token Limits**: `monthlyLimit`, `dailyLimit` based on subscription type
- **Reset Dates**: Automatic daily/monthly token reset tracking
- **Helper Methods**: `canUseTokens()`, `consumeTokens()`, `getTokenUsage()`

### 2. **Token Usage Middleware** (`middleware/tokenUsage.js`)
- **Pre-check Middleware**: `tokenUsageMiddleware(tokensNeeded)` - Validates if user can use tokens
- **Post-consumption Middleware**: `consumeTokensMiddleware(tokensUsed)` - Records actual usage
- **Utility Functions**: `estimateTokens()`, `estimateAIRequestTokens()`

### 3. **AI Service Integration** (`services/aiService.js`)
- **Token Estimation**: Methods for each AI provider (Gemini, OpenAI, Claude, Custom)
- **Usage Tracking**: Returns both response and token usage data
- **Backward Compatibility**: Existing methods still work, new methods include token data

### 4. **Admin Dashboard** (`client/src/components/UsersTab.tsx`)
- **Visual Token Usage**: Progress bars for daily/monthly usage
- **Color-coded Alerts**: Red (>90%), Yellow (>70%), Green (<70%)
- **Token Management**: Reset daily/monthly tokens, view detailed usage
- **Real-time Updates**: Live token consumption tracking

## 📊 Token Limits by Subscription

| Subscription | Daily Limit | Monthly Limit | Use Case |
|-------------|-------------|---------------|----------|
| **Guest** | 100 tokens | 1,000 tokens | Trial users |
| **Free** | 200 tokens | 5,000 tokens | Basic users |
| **Pro** | 2,000 tokens | 50,000 tokens | Power users |
| **Premium** | 10,000 tokens | 200,000 tokens | Enterprise users |

## 🔧 Implementation Guide

### Step 1: Add Token Middleware to Routes

```javascript
const { tokenUsageMiddleware, consumeTokensMiddleware } = require('../middleware/tokenUsage');

// Before AI operations
router.post('/generate-quiz', 
  auth,
  tokenUsageMiddleware(1000), // Check if user can use 1000 tokens
  async (req, res) => {
    // Your AI processing code
  }
);
```

### Step 2: Track Token Consumption

```javascript
// After successful AI operation
const aiService = await createAIService();
const result = await aiService.generateQuizWithTokens(documentText);

// Consume the actual tokens used
await req.userWithTokens.consumeTokens(result.tokenUsage.totalTokens);
```

### Step 3: Handle Token Limits

```javascript
// Check user's token status
const tokenStatus = user.canUseTokens(tokensNeeded);
if (!tokenStatus.canUse) {
  return res.status(429).json({
    success: false,
    message: 'Token limit exceeded',
    limits: tokenStatus
  });
}
```

## 🎨 Admin Dashboard Features

### User Management
- **Token Usage Visualization**: Progress bars showing daily/monthly consumption
- **Real-time Monitoring**: Live updates of token usage across all users
- **Limit Management**: Adjust token limits per user
- **Usage Analytics**: Total tokens consumed, remaining, percentages

### Token Management Actions
- **Reset Daily Tokens**: Clear daily usage counter
- **Reset Monthly Tokens**: Clear monthly usage counter
- **Reset All Tokens**: Clear total usage (admin only)
- **Adjust Limits**: Modify daily/monthly limits per user

## 📈 API Endpoints

### Admin Endpoints
- `GET /api/admin/users` - List all users with token usage
- `GET /api/admin/users/:userId/token-usage` - Get specific user's token usage
- `PATCH /api/admin/users/:userId/token-limits` - Update user's token limits
- `POST /api/admin/users/:userId/reset-tokens` - Reset user's token usage

### User Endpoints
- `GET /api/auth/me` - Get current user's token usage (can be added)
- `GET /api/users/token-usage` - Get user's own token usage

## 🔄 Automatic Token Reset

### Daily Reset
- Automatically resets `dailyTokensUsed` at midnight
- Updates `lastDailyResetDate` timestamp
- Preserves monthly and total usage

### Monthly Reset
- Automatically resets `monthlyTokensUsed` on the 1st of each month
- Updates `lastTokenResetDate` timestamp
- Preserves total usage

## 🚨 Error Handling

### Token Limit Exceeded (429)
```json
{
  "success": false,
  "message": "Token limit exceeded",
  "error": "TOKEN_LIMIT_EXCEEDED",
  "limits": {
    "daily": {
      "used": 150,
      "limit": 200,
      "remaining": 50
    },
    "monthly": {
      "used": 4500,
      "limit": 5000,
      "remaining": 500
    }
  },
  "subscription": {
    "type": "free",
    "status": "free"
  }
}
```

## 🔍 Monitoring & Analytics

### Admin Dashboard Metrics
- **Total System Tokens**: Sum of all user token usage
- **Top Token Users**: Users consuming most tokens
- **Subscription Distribution**: Token usage by subscription type
- **Usage Trends**: Daily/monthly usage patterns

### User Experience
- **Usage Warnings**: Alerts when approaching limits (70%, 90%)
- **Upgrade Prompts**: Suggestions to upgrade when limits reached
- **Usage History**: Track token consumption over time

## 🛡️ Security Features

### Admin Protection
- Admin users bypass all token limits
- Admin actions are logged for audit trails
- Token resets require admin authentication

### User Protection
- Token limits prevent abuse and control costs
- Automatic reset prevents permanent lockouts
- Graceful degradation when limits reached

## 🚀 Benefits

1. **Cost Control**: Prevent runaway AI usage costs
2. **Fair Usage**: Ensure equitable resource distribution
3. **Revenue Optimization**: Encourage subscription upgrades
4. **User Experience**: Clear limits and usage visibility
5. **Admin Control**: Complete oversight and management capabilities

## 📝 Next Steps

1. **Integrate with existing routes** using the provided examples
2. **Test token limits** with different subscription types
3. **Monitor usage patterns** in the admin dashboard
4. **Adjust limits** based on actual usage data
5. **Implement usage alerts** for users approaching limits

This system provides complete token usage tracking and limitation capabilities while maintaining a great user experience and giving administrators full control over resource allocation.
