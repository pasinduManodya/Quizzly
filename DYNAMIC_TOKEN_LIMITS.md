# Dynamic Token Limits Management System

## 🎯 Overview

A fully configurable token limits system that allows administrators to dynamically manage token usage limits for each subscription type without hardcoding values.

## 🏗️ System Architecture

### 1. **TokenLimits Model** (`models/TokenLimits.js`)
- **Dynamic Storage**: Stores configurable limits for each subscription type
- **Admin Tracking**: Records who created/modified limits
- **Validation**: Ensures limits are non-negative integers
- **Helper Methods**: `getLimitsForSubscription()`, `updateLimits()`, `getAllActiveLimits()`

### 2. **Enhanced User Model** (`models/User.js`)
- **Dynamic Loading**: `loadTokenLimits()` method fetches current limits from database
- **Fallback Values**: Default limits if database lookup fails
- **Automatic Updates**: Limits are refreshed when users access token features

### 3. **Admin API Endpoints** (`routes/admin.js`)
- `GET /api/admin/token-limits` - Get all token limits
- `PATCH /api/admin/token-limits/:subscriptionType` - Update specific limits
- `POST /api/admin/token-limits` - Create new limits
- `DELETE /api/admin/token-limits/:subscriptionType` - Delete limits
- `POST /api/admin/token-limits/apply-to-all-users` - Apply limits to all users

### 4. **Seeding System** (`routes/seed.js`)
- `POST /api/admin/seed-token-limits` - Seed default limits
- **Default Values**: Guest (100/1K), Free (200/5K), Pro (2K/50K), Premium (10K/200K)
- **Bulk Application**: Automatically applies limits to all existing users

### 5. **Admin Dashboard** (`client/src/components/TokenLimitsTab.tsx`)
- **Visual Management**: Table view of all subscription limits
- **Inline Editing**: Modal-based limit editing
- **Bulk Operations**: Seed defaults, apply to all users
- **Real-time Updates**: Live refresh of limit changes

## 🎨 Admin Dashboard Features

### Token Limits Tab
- **Subscription Overview**: View all subscription types and their limits
- **Edit Limits**: Click "Edit Limits" to modify daily/monthly limits
- **Description Field**: Add custom descriptions for each limit set
- **Bulk Actions**:
  - 🌱 **Seed Defaults**: Create/update default limits
  - **Apply to All Users**: Update all users with current limits
  - 🔄 **Refresh**: Reload limits from database

### Visual Indicators
- **Color-coded Badges**: Different colors for each subscription type
- **Formatted Numbers**: Easy-to-read token counts (1,000 vs 1000)
- **Last Updated**: Timestamp of when limits were last modified

## 🔧 How It Works

### 1. **Dynamic Limit Loading**
```javascript
// When user accesses token features
await user.loadTokenLimits(); // Fetches current limits from database
const tokenStatus = user.canUseTokens(tokensNeeded);
```

### 2. **Admin Limit Updates**
```javascript
// Admin updates limits
PATCH /api/admin/token-limits/pro
{
  "dailyLimit": 3000,
  "monthlyLimit": 75000,
  "description": "Updated Pro limits for Q2"
}
```

### 3. **Automatic User Updates**
- When limits are changed, admins can apply to all users
- Users get updated limits on their next token operation
- No downtime or manual user updates required

## 📊 Default Token Limits

| Subscription | Daily Limit | Monthly Limit | Description |
|-------------|-------------|---------------|-------------|
| **Guest** | 100 tokens | 1,000 tokens | Trial users - Limited access for testing |
| **Free** | 200 tokens | 5,000 tokens | Free tier users - Basic usage limits |
| **Pro** | 2,000 tokens | 50,000 tokens | Pro users - Enhanced limits for power users |
| **Premium** | 10,000 tokens | 200,000 tokens | Premium users - Maximum limits for enterprise use |

## 🚀 Benefits

### For Administrators
- **Complete Control**: Modify limits without code changes
- **A/B Testing**: Test different limit configurations
- **Business Flexibility**: Adjust limits based on usage patterns
- **Audit Trail**: Track who changed what and when

### For Users
- **Transparent Limits**: Clear visibility of their token allowances
- **Fair Usage**: Consistent limits across subscription tiers
- **Upgrade Incentives**: Clear value proposition for higher tiers

### For Business
- **Cost Management**: Prevent runaway AI usage costs
- **Revenue Optimization**: Encourage subscription upgrades
- **Scalability**: Easy to adjust limits as business grows

## 🔄 Migration from Hardcoded Limits

### Before (Hardcoded)
```javascript
// In User model
dailyLimit: {
  type: Number,
  default: function() {
    if (this.isGuest) return 100;
    if (this.isPro) return 2000;
    return 200;
  }
}
```

### After (Dynamic)
```javascript
// In User model
dailyLimit: {
  type: Number,
  default: 200 // Fallback only
}

// Dynamic loading
await user.loadTokenLimits(); // Fetches from database
```

## 🛠️ Setup Instructions

### 1. **Initial Setup**
1. Start the server
2. Login as admin
3. Go to Admin Dashboard → Token Limits tab
4. Click "🌱 Seed Defaults" to create initial limits

### 2. **Customize Limits**
1. Click "Edit Limits" for any subscription type
2. Modify daily/monthly limits as needed
3. Add description for context
4. Click "Save Changes"

### 3. **Apply to Users**
1. Click "Apply to All Users" to update all existing users
2. New users automatically get current limits
3. Existing users get updated limits on next token operation

## 📈 Monitoring & Analytics

### Admin Dashboard Metrics
- **Limit Utilization**: See how close users are to their limits
- **Usage Patterns**: Identify which limits need adjustment
- **Subscription Distribution**: Monitor user distribution across tiers

### Business Intelligence
- **Cost Analysis**: Track AI usage costs by subscription tier
- **Upgrade Conversion**: Monitor free-to-paid conversions
- **Limit Optimization**: Data-driven limit adjustments

## 🔒 Security & Validation

### Input Validation
- **Non-negative Integers**: Limits must be ≥ 0
- **Subscription Types**: Only valid subscription types allowed
- **Admin Authentication**: All operations require admin privileges

### Audit Trail
- **Change Tracking**: Who modified what limits and when
- **Version History**: Track limit changes over time
- **Admin Logging**: All admin actions are logged

## 🎯 Future Enhancements

### Planned Features
- **Time-based Limits**: Different limits for different time periods
- **Usage Analytics**: Detailed usage reports and trends
- **Automated Adjustments**: AI-powered limit optimization
- **User Notifications**: Alerts when approaching limits

### Integration Opportunities
- **Billing Integration**: Connect limits to billing cycles
- **Marketing Automation**: Trigger campaigns based on usage
- **Customer Support**: Usage-based support prioritization

This dynamic token limits system provides complete flexibility for administrators while maintaining a great user experience and enabling data-driven business decisions.
