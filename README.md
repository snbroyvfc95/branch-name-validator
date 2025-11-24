# 🎫 Branch Commit Validator with Jira Integration

A powerful Node.js package that validates Git branch names and commit messages with **real-time Jira ticket verification**. Now with v2.0.0, it includes comprehensive Jira API integration for enterprise-grade validation.

## 🚀 Overview

This enhanced tool maintains consistent Git conventions while ensuring your Jira tickets actually exist, providing real-time validation with intelligent caching and comprehensive error handling.

## ✨ Features

### 🎯 **Core Validation**
- ✅ **Git branch names** with proper prefixes (feature/, bugfix/, hotfix/, release/, chore/)
- ✅ **Jira ticket format** validation with multiple project support
- ✅ **Commit messages** following consistent patterns
- ✅ **Command-line interface** for easy integration
- ✅ **Programmatic API** for custom implementations

### 🎫 **NEW: Jira Integration (v2.0.0)**
- 🔍 **Real-time ticket verification** via Jira API
- ⚡ **Intelligent caching** with configurable TTL
- 🛡️ **Authentication support** with API tokens
- 🌐 **Multi-project support** (SHOP, PROJ, TASK, etc.)
- 🔧 **Configurable validation** with environment variables
- 📊 **Cache management** with statistics and cleanup
- ⚙️ **Graceful fallback** for offline development

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g branch-commit-validator
```

### Local Installation
```bash
npm install branch-commit-validator
```

## 🎯 Quick Start

### 1. **Basic Usage (Format Validation Only)**
```bash
# Validate branch names
validate-git branch feature/SHOP-1234-add-user-authentication
validate-git branch bugfix/SHOP-5678-fix-login-bug
validate-git branch hotfix/SHOP-9012-critical-security-patch

# Validate commit messages
validate-git commit SHOP-1234-add-user-authentication
validate-git commit SHOP-5678-fix-login-bug
```

### 2. **Enhanced Usage with Jira Integration**
```bash
# Set up Jira configuration (one-time setup)
export JIRA_API_URL=https://yourcompany.atlassian.net
export JIRA_USERNAME=your-email@company.com
export JIRA_API_TOKEN=your-jira-api-token

# Now validation includes real Jira ticket verification!
validate-git branch feature/SHOP-1234-user-authentication
```

**Output with Jira:**
```
🔍 Validating branch: feature/SHOP-1234-user-authentication
🔍 Validating Jira ticket: SHOP-1234...

✅ Branch name is valid and Jira ticket exists
🎫 Ticket: SHOP-1234
📋 Summary: Implement user authentication system
📊 Status: In Progress
👤 Assignee: John Doe
```

## 🎫 Jira Integration Setup

### **Environment Configuration**
```bash
# Required for Jira integration
JIRA_API_URL=https://yourcompany.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token

# Optional configuration
JIRA_PROJECT_KEYS=SHOP,PROJ,TASK    # Multiple projects (default: SHOP)
SKIP_JIRA_VALIDATION=false          # Skip Jira validation (default: false)
JIRA_CACHE_TTL=60                   # Cache TTL in minutes (default: 60)
```

### **Advanced Commands**
```bash
# Validate both branch and commit together
validate-git both "feature/SHOP-1234-auth" "SHOP-1234-implement-auth"

# View current Jira configuration
validate-git config

# Check cache statistics
validate-git cache-stats

# Clear ticket cache
validate-git cache-clear
```

### Programmatic Usage

```javascript
const { validateBranchName, validateCommitMessage } = require('branch-commit-validator');

// Validate branch name
const branchResult = validateBranchName('feature/SHOP-1234-new-feature');
console.log(branchResult.valid); // true/false
console.log(branchResult.message); // validation message

// Validate commit message
const commitResult = validateCommitMessage('SHOP-1234-new-feature');
console.log(commitResult.valid); // true/false
console.log(commitResult.message); // validation message
```

## Validation Rules

### Branch Names
- Must start with one of these prefixes:
  - `feature/` - for new features
  - `bugfix/` - for bug fixes
  - `hotfix/` - for critical fixes
- Must contain a Jira ticket pattern: `SHOP-XXXX` (where XXXX is a number)
- Description must be lowercase
- Use dashes (-) only, no spaces or underscores
- Pattern: `^[a-z]+/SHOP-\d+-[a-z0-9-]+$`

#### Valid Examples:
- `feature/SHOP-1234-add-payment-gateway`
- `bugfix/SHOP-5678-fix-validation-error`
- `hotfix/SHOP-9012-security-patch`

#### Invalid Examples:
- `feature/add-payment` (missing Jira ticket)
- `Feature/SHOP-1234-payment` (uppercase prefix)
- `feature/SHOP-1234_payment_gateway` (underscores not allowed)
- `feature/SHOP-1234-Payment Gateway` (spaces not allowed)

### Commit Messages
- Must follow the pattern: `SHOP-XXXX-description`
- Use lowercase letters, numbers, and dashes only
- No spaces or underscores allowed
- Pattern: `^SHOP-\d+-[a-z0-9-]+$`

#### Valid Examples:
- `SHOP-1234-implement-user-registration`
- `SHOP-5678-fix-database-connection`
- `SHOP-9012-update-security-headers`

#### Invalid Examples:
- `SHOP-1234 implement user registration` (spaces not allowed)
- `SHOP-1234_implement_user_registration` (underscores not allowed)
- `implement user registration` (missing Jira ticket)

## Integration with Git Hooks

You can integrate this validator with Git hooks for automatic validation:

### Pre-commit Hook
Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
branch_name=$(git symbolic-ref --short HEAD)
validate-git branch "$branch_name"
exit_code=$?
if [ $exit_code -ne 0 ]; then
    echo "Branch name validation failed!"
    exit 1
fi
```

### Commit Message Hook
Create `.git/hooks/commit-msg`:
```bash
#!/bin/bash
commit_msg=$(cat $1)
validate-git commit "$commit_msg"
exit_code=$?
if [ $exit_code -ne 0 ]; then
    echo "Commit message validation failed!"
    exit 1
fi
```

Don't forget to make the hooks executable:
```bash
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg
```

## API Reference

### validateBranchName(branchName)

Validates a Git branch name against the defined rules.

**Parameters:**
- `branchName` (string): The branch name to validate

**Returns:**
- Object with properties:
  - `valid` (boolean): Whether the branch name is valid
  - `message` (string): Validation result message

### validateCommitMessage(commitMessage)

Validates a commit message against the defined rules.

**Parameters:**
- `commitMessage` (string): The commit message to validate

**Returns:**
- Object with properties:
  - `valid` (boolean): Whether the commit message is valid
  - `message` (string): Validation result message

## Error Codes

The CLI exits with the following codes:
- `0`: Validation successful
- `1`: Validation failed or invalid usage

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/SHOP-XXXX-your-feature`
3. Commit your changes: `git commit -m "SHOP-XXXX-add-your-feature"`
4. Push to the branch: `git push origin feature/SHOP-XXXX-your-feature`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**Sanjib Roy**

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.

## Changelog

### v1.0.0
- Initial release
- Branch name validation
- Commit message validation
- CLI interface
- Programmatic API