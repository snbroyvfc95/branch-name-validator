# 🎫 Branch Commit Validator v3.0.0

Simple Git branch and commit validator for consistent naming conventions.

## 🚀 Quick Start

```bash
# Install globally
npm install -g branch-commit-validator

# Validate branch name
npx validate-git branch "feature/SHOP-1234-fix-user-login"

# Validate commit message  
npx validate-git commit "SHOP-1234-fix-user-login"

# Show configuration
npx validate-git config
```

## 📝 Format Rules

### ✅ Valid Branch Names
```
feature/SHOP-1234-fix-user-authentication
bugfix/PROJ-5678-resolve-payment-issue  
hotfix/TASK-9876-critical-security-patch
release/VFC-2024-version-2-0-0
chore/SHOP-1111-update-dependencies
```

### ✅ Valid Commit Messages
```
SHOP-1234-fix-user-authentication
PROJ-5678-resolve-payment-issue  
TASK-9876-critical-security-patch
```

### ❌ Invalid Examples
```
fix-user-login                    # Missing ticket ID
feature/fix_user_login            # Underscores not allowed
SHOP-1234 Fix User Login         # Spaces not allowed
feature/SHOP-1234-Fix-Login      # Uppercase not allowed
```

## ⚙️ Configuration

Create `.env` file:
```bash
PROJECT_KEYS=SHOP,PROJ,TASK,VFC
SKIP_VALIDATION=false
```

## 🏗️ Husky Integration

```bash
# Install husky
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx validate-git branch \$(git rev-parse --abbrev-ref HEAD)"
```

## 📋 Commands

- `validate-git branch <name>` - Validate branch name
- `validate-git commit <message>` - Validate commit message  
- `validate-git both <branch> <commit>` - Validate both
- `validate-git config` - Show configuration

## 🎯 Features

- ✅ Format validation (no API calls)
- ✅ Project key validation
- ✅ Naming convention enforcement
- ✅ Instant validation
- ✅ Zero dependencies
- ✅ Configurable project keys

**Perfect for teams that need consistent Git naming without external API dependencies!** 🎊