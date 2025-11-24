# 🎫 Jira Integration Guide

## 📋 Overview

The enhanced branch-commit-validator (v2.0.0) now includes **Jira ticket validation** that verifies your tickets actually exist in your Jira instance, providing real-time validation with intelligent caching and comprehensive error handling.

## 🚀 New Features

### ✨ **Jira Ticket Validation**
- **Real-time API verification** of ticket existence
- **Multi-project support** with configurable project keys
- **Intelligent caching** with TTL to improve performance
- **Comprehensive error handling** for network issues and authentication
- **Graceful fallback** when Jira is unavailable

### 🛡️ **Enterprise Features**
- **Authentication support** with API tokens
- **Configurable timeouts** and retry logic
- **Cache management** with statistics and cleanup
- **Environment-based configuration**
- **Skip options** for offline development

## ⚙️ Configuration

### 🔧 **Environment Variables**

Set these environment variables to enable Jira integration:

```bash
# Required for Jira integration
JIRA_API_URL=https://yourcompany.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token

# Optional configuration
JIRA_PROJECT_KEYS=SHOP,PROJ,TASK  # Comma-separated (default: SHOP)
SKIP_JIRA_VALIDATION=false        # Set to 'true' to skip Jira validation
JIRA_CACHE_TTL=60                 # Cache TTL in minutes (default: 60)
JIRA_TIMEOUT=10000                # API timeout in milliseconds (default: 10000)
```

### 🔑 **Getting Your Jira API Token**

1. **Log in to Jira** and go to your account settings
2. **Navigate to Security** → **Create and manage API tokens**
3. **Create API token** and copy the generated token
4. **Set environment variable**: `JIRA_API_TOKEN=your-token-here`

## 🎯 Usage Examples

### 🌿 **Branch Name Validation with Jira**

```bash
# Valid branch with existing Jira ticket
npx validate-git branch "feature/SHOP-1234-user-authentication"
```

**Output:**
```
🔍 Validating branch: feature/SHOP-1234-user-authentication
🔍 Validating Jira ticket: SHOP-1234...

✅ Branch name is valid and Jira ticket exists
🎫 Ticket: SHOP-1234
📋 Summary: Implement user authentication system
📊 Status: In Progress
👤 Assignee: John Doe
```

### 💬 **Commit Message Validation with Jira**

```bash
# Valid commit with existing Jira ticket
npx validate-git commit "SHOP-1234-implement-user-auth"
```

**Output:**
```
🔍 Validating commit: SHOP-1234-implement-user-auth
🔍 Using cached result for SHOP-1234: Valid

✅ Commit message is valid and Jira ticket exists
🎫 Ticket: SHOP-1234
📋 Summary: Implement user authentication system
📊 Status: In Progress
👤 Assignee: John Doe
```

### 🔄 **Validate Both Branch and Commit**

```bash
npx validate-git both "feature/SHOP-1234-user-auth" "SHOP-1234-implement-authentication"
```

**Output:**
```
🔍 Validating branch: feature/SHOP-1234-user-auth
🔍 Validating commit: SHOP-1234-implement-authentication

📊 Validation Results:
Branch: ✅ Branch name is valid and Jira ticket exists
Commit: ✅ Commit message is valid and Jira ticket exists

🎫 Jira Ticket: SHOP-1234
📋 Summary: Implement user authentication system
📊 Status: In Progress
👤 Assignee: John Doe
```

## 📊 Cache Management

### 🔍 **View Cache Statistics**

```bash
npx validate-git cache-stats
```

**Output:**
```
📊 Jira Cache Statistics:
Total Entries: 15
Valid Tickets: 12
Invalid Tickets: 2
Skipped Validations: 1
Oldest Entry: SHOP-1001 (2024-11-16T10:30:00.000Z)
Newest Entry: SHOP-1234 (2024-11-16T11:45:00.000Z)
```

### 🧹 **Clear Cache**

```bash
npx validate-git cache-clear
```

**Output:**
```
✅ Cache cleared successfully
```

## ⚙️ Configuration Management

### 📋 **View Current Configuration**

```bash
npx validate-git config
```

**Output:**
```
⚙️ Current Jira Configuration:
API URL: https://yourcompany.atlassian.net
Username: john.doe@company.com
API Token: ***configured***
Project Keys: SHOP, PROJ, TASK
Skip Validation: false
Cache TTL: 60 minutes
Timeout: 10000 ms

✅ Jira integration is configured
```

## 🛠️ Error Handling

### 🔒 **Authentication Errors**

```bash
❌ Jira authentication failed. Check JIRA_USERNAME and JIRA_API_TOKEN
```

**Solution:**
1. Verify your username/email is correct
2. Generate a new API token in Jira
3. Update `JIRA_API_TOKEN` environment variable

### 🌐 **Network Issues**

```bash
❌ Jira API connection failed: connect ECONNREFUSED
```

**Solutions:**
1. Check internet connection
2. Verify `JIRA_API_URL` is correct
3. Check corporate firewall/proxy settings
4. Use `SKIP_JIRA_VALIDATION=true` for offline development

### 🎫 **Ticket Not Found**

```bash
❌ Jira ticket SHOP-9999 does not exist or is not accessible
```

**Solutions:**
1. Verify the ticket number is correct
2. Check if you have access permissions
3. Ensure the ticket exists in the specified project

### ⏱️ **API Timeout**

```bash
❌ Jira API timeout after 10000ms
```

**Solutions:**
1. Increase timeout: `JIRA_TIMEOUT=30000`
2. Check Jira instance performance
3. Use cached results when available

## 🔧 Advanced Configuration

### 🏢 **Multiple Project Support**

```bash
# Support multiple Jira projects
JIRA_PROJECT_KEYS=SHOP,PROJ,TASK,BUG

# Now these are all valid:
# feature/SHOP-1234-description
# feature/PROJ-5678-description  
# feature/TASK-9012-description
# feature/BUG-3456-description
```

### ⚡ **Performance Optimization**

```bash
# Optimize for high-volume usage
JIRA_CACHE_TTL=120          # Cache for 2 hours
JIRA_TIMEOUT=5000           # Faster timeout
SKIP_JIRA_VALIDATION=true   # Skip in CI/development
```

### 🧪 **Development Mode**

```bash
# For local development without Jira access
SKIP_JIRA_VALIDATION=true

# Validation output:
✅ Branch name is valid (Jira validation skipped)
```

## 🔄 Integration Examples

### 🐙 **Git Hooks Integration**

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname -- "$0")/_/husky.sh"

# Get current branch
BRANCH_NAME=$(git symbolic-ref --short HEAD)

# Validate branch name with Jira
npx validate-git branch "$BRANCH_NAME"
BRANCH_EXIT_CODE=$?

if [ $BRANCH_EXIT_CODE -ne 0 ]; then
    echo "❌ Branch validation failed!"
    exit 1
fi

echo "✅ Branch validation passed!"
```

### 🔄 **CI/CD Integration**

```yaml
# GitHub Actions
- name: Validate Branch Name
  run: |
    export JIRA_API_URL="${{ secrets.JIRA_API_URL }}"
    export JIRA_USERNAME="${{ secrets.JIRA_USERNAME }}"
    export JIRA_API_TOKEN="${{ secrets.JIRA_API_TOKEN }}"
    npx validate-git branch ${{ github.head_ref }}

# GitLab CI
validate-branch:
  script:
    - export JIRA_API_URL="$JIRA_API_URL"
    - export JIRA_USERNAME="$JIRA_USERNAME" 
    - export JIRA_API_TOKEN="$JIRA_API_TOKEN"
    - npx validate-git branch $CI_COMMIT_REF_NAME
```

### 📊 **Team Dashboard Integration**

```javascript
// Monitor team's branch validation
const { getCacheStats } = require('branch-commit-validator');

const stats = getCacheStats();
console.log(`Team validated ${stats.totalEntries} tickets today`);
console.log(`Success rate: ${(stats.validEntries / stats.totalEntries * 100).toFixed(1)}%`);
```

## 📈 Benefits

### ✅ **For Developers**
- **Real-time feedback** on ticket validity
- **Intelligent caching** prevents repeated API calls
- **Clear error messages** with actionable solutions
- **Offline development** support with skip options

### ✅ **For Teams**
- **Consistent ticket validation** across all branches
- **Reduced invalid ticket references** in code
- **Better project tracking** and accountability
- **Integration with existing workflows**

### ✅ **For Organizations**
- **API efficiency** with smart caching
- **Configurable validation rules** per project
- **Audit trail** of ticket validation attempts
- **Scalable** for large teams and projects

## 🐛 Troubleshooting

### 🔍 **Debug Mode**

Enable detailed logging for troubleshooting:

```bash
DEBUG=branch-commit-validator npx validate-git branch "your-branch"
```

### 📋 **Common Issues**

| Issue | Cause | Solution |
|-------|-------|----------|
| `Authentication failed` | Invalid credentials | Check JIRA_USERNAME and JIRA_API_TOKEN |
| `Connection refused` | Network/firewall | Check JIRA_API_URL and network access |
| `Timeout` | Slow Jira instance | Increase JIRA_TIMEOUT value |
| `Invalid project key` | Wrong project | Update JIRA_PROJECT_KEYS |

### 💡 **Best Practices**

1. **Use environment files** (`.env`) for configuration
2. **Set reasonable cache TTL** (60-120 minutes)
3. **Configure timeout** based on Jira performance
4. **Use skip validation** for CI/development environments
5. **Monitor cache statistics** for optimization insights

This Jira integration transforms your branch validation from simple format checking into comprehensive project management integration! 🎯