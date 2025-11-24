#!/usr/bin/env node

/**
 * Content Relevance Validation Test
 * Demonstrates the new feature that validates branch/commit names against Jira ticket content
 */

const { 
  validateContentRelevance, 
  extractKeywords 
} = require('./index.js');

console.log('🎯 Content Relevance Validation Test Suite\n');

// Test cases based on your example: "POC - create app to restrict gift cards"
const testCases = [
  {
    ticketSummary: 'POC - create app to restrict gift cards',
    branchName: 'feature/SHOP-8548-create-gift-card-restriction-app',
    expected: 'high'
  },
  {
    ticketSummary: 'POC - create app to restrict gift cards', 
    branchName: 'feature/SHOP-8548-gift-card-app',
    expected: 'good'
  },
  {
    ticketSummary: 'POC - create app to restrict gift cards',
    branchName: 'feature/SHOP-8548-create-app',
    expected: 'basic'
  },
  {
    ticketSummary: 'POC - create app to restrict gift cards',
    branchName: 'feature/SHOP-8548-user-authentication',
    expected: 'poor'
  },
  {
    ticketSummary: 'Fix database connection timeout issues',
    branchName: 'bugfix/SHOP-1234-fix-database-timeout',
    expected: 'high'
  },
  {
    ticketSummary: 'Implement user registration with email verification',
    branchName: 'feature/SHOP-5678-user-registration-email',
    expected: 'high'
  }
];

console.log('🧪 Testing Keyword Extraction:');
console.log('=================================');

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}:`);
  console.log(`📋 Ticket: "${testCase.ticketSummary}"`);
  
  const keywords = extractKeywords(testCase.ticketSummary);
  console.log(`🔑 Extracted Keywords: [${keywords.join(', ')}]`);
  
  const result = validateContentRelevance(testCase.branchName, testCase.ticketSummary, 'SHOP-8548');
  console.log(`🌿 Branch: "${testCase.branchName}"`);
  console.log(`${result.relevant ? '✅' : '❌'} ${result.message}`);
  
  if (result.matchedKeywords && result.matchedKeywords.length > 0) {
    console.log(`✅ Matched: [${result.matchedKeywords.join(', ')}]`);
  }
  
  if (result.missingKeywords && result.missingKeywords.length > 0) {
    console.log(`❌ Missing: [${result.missingKeywords.join(', ')}]`);
  }
  
  // Determine performance level
  let performance = 'poor';
  if (result.matchPercentage >= 70) performance = 'excellent';
  else if (result.matchPercentage >= 50) performance = 'good';
  else if (result.matchPercentage >= 30) performance = 'basic';
  
  console.log(`📊 Performance: ${performance} (${result.matchPercentage}%)`);
  
  // Check if expectation matches
  const expectedMap = { high: 70, good: 50, basic: 30, poor: 0 };
  const actualPerformance = result.matchPercentage >= 70 ? 'high' : 
                           result.matchPercentage >= 50 ? 'good' :
                           result.matchPercentage >= 30 ? 'basic' : 'poor';
  
  if (actualPerformance === testCase.expected || 
      (actualPerformance === 'excellent' && testCase.expected === 'high')) {
    console.log('🎯 Expected result achieved!');
  } else {
    console.log(`⚠️ Expected ${testCase.expected}, got ${actualPerformance}`);
  }
});

console.log('\n🎯 Real-world Example (Your Jira Ticket):');
console.log('==========================================');
console.log('📋 Ticket: SHOP-8548 - "POC - create app to restrict gift cards"');
console.log('🔗 URL: https://digital.vfc.com/jira/browse/SHOP-8548');
console.log('');

const realWorldExamples = [
  'feature/SHOP-8548-create-gift-card-restriction-app',
  'feature/SHOP-8548-poc-gift-card-app', 
  'feature/SHOP-8548-restrict-gift-cards',
  'feature/SHOP-8548-create-app-restrict',
  'feature/SHOP-8548-user-management',  // Poor example
  'bugfix/SHOP-8548-fix-login-bug'      // Poor example
];

realWorldExamples.forEach((branchName, index) => {
  console.log(`\nExample ${index + 1}: ${branchName}`);
  const result = validateContentRelevance(branchName, 'POC - create app to restrict gift cards', 'SHOP-8548');
  console.log(`${result.relevant ? '✅' : '❌'} ${result.message}`);
  
  if (result.matchedKeywords?.length > 0) {
    console.log(`✅ Found: ${result.matchedKeywords.join(', ')}`);
  }
  if (result.missingKeywords?.length > 0) {
    console.log(`💡 Suggest: ${result.missingKeywords.slice(0, 3).join(', ')}`);
  }
});

console.log('\n📈 Benefits of Content Relevance Validation:');
console.log('==============================================');
console.log('✅ Ensures developers work on correct tickets');
console.log('✅ Improves code traceability and organization');
console.log('✅ Catches copy-paste errors in branch names');
console.log('✅ Maintains meaningful Git history');
console.log('✅ Enhances team collaboration and code reviews');

console.log('\n🚀 Integration completed! Your validator now checks:');
console.log('1. 📝 Branch/commit format validity');
console.log('2. 🎫 Jira ticket existence via API');
console.log('3. 🎯 Content relevance to ticket summary');
console.log('4. ⚡ Performance optimization with caching');

process.exit(0);