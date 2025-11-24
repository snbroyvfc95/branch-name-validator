#!/usr/bin/env node

const { 
  validateBranchName, 
  validateCommitMessage, 
  validateBoth,
  showConfig
} = require('./index.js');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('🎫 Simple Branch & Commit Validator');
  console.log('');
  console.log('Usage:');
  console.log('  validate-git branch <branch-name>     - Validate branch name format');
  console.log('  validate-git commit <commit-message>  - Validate commit message format');
  console.log('  validate-git both <branch> <commit>   - Validate both branch and commit');
  console.log('  validate-git config                   - Show current configuration');
  console.log('');
  console.log('Examples:');
  console.log('  validate-git branch "feature/SHOP-1234-fix-user-login"');
  console.log('  validate-git commit "SHOP-1234-fix-user-login"');
  console.log('  validate-git both "feature/SHOP-1234-fix-bug" "SHOP-1234-fix-bug"');
  console.log('');
  console.log('Environment Variables:');
  console.log('  PROJECT_KEYS      - Comma-separated project keys (default: SHOP,PROJ,TASK)');
  console.log('  SKIP_VALIDATION   - Set to "true" to skip validation entirely');
  console.log('');
  process.exit(1);
}

const command = args[0];

async function runValidation() {
  try {
    switch (command) {
      case 'branch': {
        const branchName = args[1];
        if (!branchName) {
          console.log('❌ Error: Please provide a branch name to validate');
          console.log('Usage: validate-git branch <branch-name>');
          console.log('Example: validate-git branch "feature/SHOP-1234-fix-user-login"');
          process.exit(1);
        }
        
        console.log(`🔍 Validating branch: ${branchName}`);
        const result = validateBranchName(branchName);
        
        console.log('\\n' + result.message);
        if (result.suggestion) {
          console.log(`💡 Suggestion: ${result.suggestion}`);
        }
        
        if (result.ticketId) {
          console.log(`🎫 Ticket ID: ${result.ticketId}`);
        }
        
        process.exit(result.valid ? 0 : 1);
      }
      
      case 'commit': {
        const commitMessage = args[1];
        if (!commitMessage) {
          console.log('❌ Error: Please provide a commit message to validate');
          console.log('Usage: validate-git commit <commit-message>');
          console.log('Example: validate-git commit "SHOP-1234-fix-user-login"');
          process.exit(1);
        }
        
        console.log(`📝 Validating commit: ${commitMessage}`);
        const result = validateCommitMessage(commitMessage);
        
        console.log('\\n' + result.message);
        if (result.suggestion) {
          console.log(`💡 Suggestion: ${result.suggestion}`);
        }
        
        if (result.ticketId) {
          console.log(`🎫 Ticket ID: ${result.ticketId}`);
        }
        
        process.exit(result.valid ? 0 : 1);
      }
      
      case 'both': {
        const branchName = args[1];
        const commitMessage = args[2];
        if (!branchName || !commitMessage) {
          console.log('❌ Error: Please provide both branch name and commit message');
          console.log('Usage: validate-git both <branch-name> <commit-message>');
          console.log('Example: validate-git both "feature/SHOP-1234-fix-bug" "SHOP-1234-fix-bug"');
          process.exit(1);
        }
        
        console.log(`🔄 Validating both branch and commit...`);
        const result = validateBoth(branchName, commitMessage);
        
        console.log('\\n📊 Validation Results:');
        console.log(`🌿 Branch: ${result.branchResult.valid ? '✅' : '❌'} ${result.branchResult.message}`);
        console.log(`💬 Commit: ${result.commitResult.valid ? '✅' : '❌'} ${result.commitResult.message}`);
        
        if (result.branchResult.suggestion) {
          console.log(`💡 Branch suggestion: ${result.branchResult.suggestion}`);
        }
        if (result.commitResult.suggestion) {
          console.log(`💡 Commit suggestion: ${result.commitResult.suggestion}`);
        }
        
        console.log(`\\n🎯 Overall: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
        
        process.exit(result.valid ? 0 : 1);
      }
      
      case 'config': {
        const result = showConfig();
        process.exit(0);
      }
      
      default: {
        console.log(`❌ Unknown command: ${command}`);
        console.log('Run "validate-git" without arguments to see usage information.');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    process.exit(1);
  }
}

runValidation();