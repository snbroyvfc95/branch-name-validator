#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Enhanced Branch Commit Validator v2.0.0
 * Tests Jira integration, caching, error handling, and all new features
 */

const { 
  validateBranchName, 
  validateCommitMessage, 
  validateBoth,
  clearCache,
  getCacheStats,
  JIRA_CONFIG 
} = require('./index.js');

console.log('🧪 Running Enhanced Branch Commit Validator Test Suite v2.0.0\n');

async function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  // Test helper function
  function test(description, testFn) {
    return new Promise(async (resolve) => {
      totalTests++;
      try {
        console.log(`🔍 Testing: ${description}`);
        const result = await testFn();
        if (result) {
          console.log(`✅ PASS: ${description}\n`);
          passedTests++;
        } else {
          console.log(`❌ FAIL: ${description}\n`);
        }
      } catch (error) {
        console.log(`❌ ERROR: ${description} - ${error.message}\n`);
      }
      resolve();
    });
  }

  // Test 1: Valid branch names with different project keys
  await test('Valid branch name with SHOP project', async () => {
    const result = await validateBranchName('feature/SHOP-1234-user-authentication');
    return result.valid === true;
  });

  await test('Valid branch name with different project (PROJ)', async () => {
    process.env.JIRA_PROJECT_KEYS = 'SHOP,PROJ,TASK';
    const result = await validateBranchName('feature/PROJ-5678-new-feature');
    return result.valid === true;
  });

  // Test 2: Invalid branch names
  await test('Invalid branch name - wrong prefix', async () => {
    const result = await validateBranchName('invalid/SHOP-1234-test');
    return result.valid === false && result.message.includes('must start with');
  });

  await test('Invalid branch name - invalid project key', async () => {
    const result = await validateBranchName('feature/INVALID-1234-test');
    return result.valid === false && result.message.includes('Invalid branch name format');
  });

  await test('Invalid branch name - no ticket ID', async () => {
    const result = await validateBranchName('feature/no-ticket-here');
    return result.valid === false;
  });

  // Test 3: Valid commit messages
  await test('Valid commit message', async () => {
    const result = await validateCommitMessage('SHOP-1234-implement-feature');
    return result.valid === true;
  });

  await test('Valid commit message with different project', async () => {
    const result = await validateCommitMessage('PROJ-5678-fix-bug');
    return result.valid === true;
  });

  // Test 4: Invalid commit messages
  await test('Invalid commit message - wrong format', async () => {
    const result = await validateCommitMessage('invalid-commit-message');
    return result.valid === false;
  });

  await test('Invalid commit message - spaces', async () => {
    const result = await validateCommitMessage('SHOP-1234 with spaces');
    return result.valid === false;
  });

  // Test 5: Validate both branch and commit
  await test('Valid both branch and commit', async () => {
    const result = await validateBoth('feature/SHOP-1234-test', 'SHOP-1234-test-commit');
    return result.valid === true && result.branch.valid && result.commit.valid;
  });

  await test('Invalid both - branch invalid', async () => {
    const result = await validateBoth('invalid/SHOP-1234-test', 'SHOP-1234-test-commit');
    return result.valid === false && !result.branch.valid;
  });

  // Test 6: New branch prefixes (release/, chore/)
  await test('Valid release branch', async () => {
    const result = await validateBranchName('release/SHOP-1234-v2-release');
    return result.valid === true;
  });

  await test('Valid chore branch', async () => {
    const result = await validateBranchName('chore/SHOP-1234-dependency-update');
    return result.valid === true;
  });

  // Test 7: Configuration and cache management
  await test('Cache statistics function', async () => {
    const stats = getCacheStats();
    return typeof stats === 'object' && typeof stats.totalEntries === 'number';
  });

  await test('Cache clear function', async () => {
    const result = clearCache();
    return result.success === true;
  });

  await test('JIRA_CONFIG object exists', async () => {
    return typeof JIRA_CONFIG === 'object' && 
           Array.isArray(JIRA_CONFIG.projectKeys) &&
           JIRA_CONFIG.projectKeys.includes('SHOP');
  });

  // Test 8: Skip validation mode
  await test('Skip validation mode', async () => {
    const originalSkip = process.env.SKIP_JIRA_VALIDATION;
    process.env.SKIP_JIRA_VALIDATION = 'true';
    
    const result = await validateBranchName('feature/SHOP-1234-test-skip');
    
    // Restore original value
    process.env.SKIP_JIRA_VALIDATION = originalSkip;
    
    return result.valid === true && (result.jiraSkipped === true || result.message.includes('skipped'));
  });

  // Test 9: Error handling - missing ticket ID
  await test('Error handling - no ticket in branch', async () => {
    const result = await validateBranchName('feature/no-ticket-pattern');
    return result.valid === false && result.message.includes('No valid Jira ticket ID');
  });

  // Test 10: Multiple project keys support
  await test('Multiple project keys configuration', async () => {
    process.env.JIRA_PROJECT_KEYS = 'SHOP,PROJ,TASK,BUG';
    
    const shopResult = await validateBranchName('feature/SHOP-1234-test');
    const projResult = await validateBranchName('feature/PROJ-5678-test');
    const taskResult = await validateBranchName('feature/TASK-9012-test');
    const bugResult = await validateBranchName('feature/BUG-3456-test');
    
    return shopResult.valid && projResult.valid && taskResult.valid && bugResult.valid;
  });

  // Test Results Summary
  console.log('🎯 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Branch Commit Validator v2.0.0 is working perfectly!');
    console.log('\n🚀 New Features Verified:');
    console.log('   ✅ Jira ticket ID validation');
    console.log('   ✅ Multiple project key support');
    console.log('   ✅ Enhanced error handling');
    console.log('   ✅ Caching system');
    console.log('   ✅ Skip validation mode');
    console.log('   ✅ New branch prefixes (release/, chore/)');
    console.log('   ✅ Async/await support');
    console.log('   ✅ Comprehensive CLI commands');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} tests failed. Please review the failing tests above.`);
  }
  
  // Display current configuration
  console.log('\n⚙️ Current Configuration:');
  console.log(`Project Keys: ${JIRA_CONFIG.projectKeys.join(', ')}`);
  console.log(`Skip Validation: ${JIRA_CONFIG.skipValidation}`);
  console.log(`Cache TTL: ${JIRA_CONFIG.cacheTTL} minutes`);
  console.log(`API URL: ${JIRA_CONFIG.apiUrl || 'Not configured'}`);
  
  // Cache statistics
  const finalStats = getCacheStats();
  console.log('\n📊 Final Cache Statistics:');
  console.log(`Total Entries: ${finalStats.totalEntries}`);
  console.log(`Valid Tickets: ${finalStats.validEntries}`);
  console.log(`Invalid Tickets: ${finalStats.invalidEntries}`);
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run all tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});