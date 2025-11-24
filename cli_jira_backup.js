#!/usr/bin/env node

const { 
  validateBranchName, 
  validateCommitMessage, 
  validateBoth,
  showConfig,
  CONFIG 
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
          process.exit(1);
        }
        
        console.log(`🔍 Validating branch: ${branchName}`);
        const result = await validateBranchName(branchName);
        
        console.log('\n' + result.message);
        if (result.suggestion) {
          console.log(`💡 Suggestion: ${result.suggestion}`);
        }
        if (result.jiraError) {
          console.log(`🎫 Jira Error: ${result.jiraError}`);
        }
        if (result.jiraInfo && !result.jiraSkipped) {
          console.log(`🎫 Ticket: ${result.ticketId}`);
          console.log(`📋 Summary: ${result.jiraInfo.summary}`);
          console.log(`📊 Status: ${result.jiraInfo.status}`);
          console.log(`👤 Assignee: ${result.jiraInfo.assignee}`);
        }
        if (result.relevanceInfo) {
          console.log(`🎯 Content Relevance: ${result.relevanceInfo.matchPercentage}%`);
          if (result.relevanceInfo.matchedKeywords && result.relevanceInfo.matchedKeywords.length > 0) {
            console.log(`✅ Matched Keywords: ${result.relevanceInfo.matchedKeywords.join(', ')}`);
          }
          if (result.relevanceInfo.suggestedKeywords && result.relevanceInfo.suggestedKeywords.length > 0) {
            console.log(`💡 Consider Adding: ${result.relevanceInfo.suggestedKeywords.join(', ')}`);
          }
          if (result.relevanceInfo.explanation) {
            console.log(`📝 ${result.relevanceInfo.explanation}`);
          }
        }
        
        process.exit(result.valid ? 0 : 1);
      }
      
      case 'commit': {
        const commitMessage = args[1];
        if (!commitMessage) {
          console.log('❌ Error: Please provide a commit message to validate');
          process.exit(1);
        }
        
        console.log(`🔍 Validating commit: ${commitMessage}`);
        const result = await validateCommitMessage(commitMessage);
        
        console.log('\n' + result.message);
        if (result.suggestion) {
          console.log(`💡 Suggestion: ${result.suggestion}`);
        }
        if (result.jiraError) {
          console.log(`🎫 Jira Error: ${result.jiraError}`);
        }
        if (result.jiraInfo && !result.jiraSkipped) {
          console.log(`🎫 Ticket: ${result.ticketId}`);
          console.log(`📋 Summary: ${result.jiraInfo.summary}`);
          console.log(`📊 Status: ${result.jiraInfo.status}`);
          console.log(`👤 Assignee: ${result.jiraInfo.assignee}`);
        }
        if (result.relevanceInfo) {
          console.log(`🎯 Content Relevance: ${result.relevanceInfo.matchPercentage}%`);
          if (result.relevanceInfo.matchedKeywords && result.relevanceInfo.matchedKeywords.length > 0) {
            console.log(`✅ Matched Keywords: ${result.relevanceInfo.matchedKeywords.join(', ')}`);
          }
          if (result.relevanceInfo.suggestedKeywords && result.relevanceInfo.suggestedKeywords.length > 0) {
            console.log(`💡 Consider Adding: ${result.relevanceInfo.suggestedKeywords.join(', ')}`);
          }
          if (result.relevanceInfo.explanation) {
            console.log(`📝 ${result.relevanceInfo.explanation}`);
          }
        }
        
        process.exit(result.valid ? 0 : 1);
      }
      
      case 'both': {
        const branchName = args[1];
        const commitMessage = args[2];
        if (!branchName || !commitMessage) {
          console.log('❌ Error: Please provide both branch name and commit message');
          console.log('Usage: validate-git both <branch-name> <commit-message>');
          process.exit(1);
        }
        
        console.log(`🔍 Validating branch: ${branchName}`);
        console.log(`🔍 Validating commit: ${commitMessage}`);
        const result = await validateBoth(branchName, commitMessage);
        
        console.log('\n📊 Validation Results:');
        console.log(`Branch: ${result.branch.valid ? '✅' : '❌'} ${result.branch.message}`);
        console.log(`Commit: ${result.commit.valid ? '✅' : '❌'} ${result.commit.message}`);
        
        if (result.summary.jiraInfo) {
          console.log(`\n🎫 Jira Ticket: ${result.summary.jiraTicket}`);
          console.log(`📋 Summary: ${result.summary.jiraInfo.summary}`);
          console.log(`📊 Status: ${result.summary.jiraInfo.status}`);
          console.log(`👤 Assignee: ${result.summary.jiraInfo.assignee}`);
        }
        
        process.exit(result.valid ? 0 : 1);
      }
      
      case 'config': {
        console.log('⚙️ Current Jira Configuration:');
        console.log(`API URL: ${JIRA_CONFIG.apiUrl || 'Not configured'}`);
        console.log(`Username: ${JIRA_CONFIG.username || 'Not configured'}`);
        console.log(`API Token: ${JIRA_CONFIG.apiToken ? '***configured***' : 'Not configured'}`);
        console.log(`Project Keys: ${JIRA_CONFIG.projectKeys.join(', ')}`);
        console.log(`Skip Validation: ${JIRA_CONFIG.skipValidation}`);
        console.log(`Cache TTL: ${JIRA_CONFIG.cacheTTL} minutes`);
        console.log(`Timeout: ${JIRA_CONFIG.timeout} ms`);
        
        if (!JIRA_CONFIG.apiUrl || !JIRA_CONFIG.username || !JIRA_CONFIG.apiToken) {
          console.log('\n⚠️ Jira integration not fully configured. Set these environment variables:');
          console.log('  JIRA_API_URL=https://yourcompany.atlassian.net');
          console.log('  JIRA_USERNAME=your-email@company.com');
          console.log('  JIRA_API_TOKEN=your-api-token');
        } else {
          console.log('\n✅ Jira integration is configured');
        }
        
        process.exit(0);
      }
      
      case 'cache-stats': {
        const stats = getCacheStats();
        console.log('📊 Jira Cache Statistics:');
        console.log(`Total Entries: ${stats.totalEntries}`);
        console.log(`Valid Tickets: ${stats.validEntries}`);
        console.log(`Invalid Tickets: ${stats.invalidEntries}`);
        console.log(`Skipped Validations: ${stats.skippedEntries}`);
        
        if (stats.oldestEntry) {
          console.log(`Oldest Entry: ${stats.oldestEntry.ticketId} (${stats.oldestEntry.timestamp})`);
        }
        if (stats.newestEntry) {
          console.log(`Newest Entry: ${stats.newestEntry.ticketId} (${stats.newestEntry.timestamp})`);
        }
        
        process.exit(0);
      }
      
      case 'cache-clear': {
        const result = clearCache();
        console.log(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
        process.exit(result.success ? 0 : 1);
      }
      
      default:
        console.log(`❌ Error: Unknown command "${command}"`);
        console.log('Use "validate-git" without arguments to see usage information');
        process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('Stack trace:', error.stack);
    process.exit(1);
  }
}

runValidation();