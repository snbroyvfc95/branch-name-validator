/**
 * Simple Branch Name and Commit Message Validator
 * 
 * Features:
 * - Validates branch name format and patterns
 * - Validates commit message format
 * - Supports multiple project keys
 * - Simple format validation without external API calls
 * 
 * Rules:
 * - Branch name must start with feature/, bugfix/, hotfix/, release/, or chore/
 * - Must contain a valid ticket pattern like SHOP-1234
 * - Description must be lowercase, use dashes (-), no spaces or underscores
 * - Commit message must follow: SHOP-1234-description format
 * 
 * Environment Variables:
 * - PROJECT_KEYS: Comma-separated list of valid project keys (default: SHOP,PROJ,TASK)
 * - SKIP_VALIDATION: Set to 'true' to skip validation entirely
 */

// Load environment variables from .env file if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use system environment variables
}

const fs = require('fs');
const path = require('path');

// Basic Configuration
const CONFIG = {
  projectKeys: (process.env.PROJECT_KEYS || 'SHOP,PROJ,TASK').split(',').map(key => key.trim()),
  skipValidation: process.env.SKIP_VALIDATION === 'true'
};

// Simple validation patterns
const PATTERNS = {
  branch: /^(feature|bugfix|hotfix|release|chore)\/([A-Z]+)-(\d+)-(.+)$/,
  commit: /^([A-Z]+)-(\d+)-(.+)$/,
  ticketId: /([A-Z]+)-(\d+)/
};

/**
 * Extract ticket ID from branch or commit name
 */
function extractTicketId(name) {
  const matches = name.match(PATTERNS.ticketId);
  return matches ? matches[0] : null;
}

/**
 * Get expected format description for error messages
 */
function getExpectedFormat(type) {
  switch (type) {
    case 'branch':
      return `${CONFIG.projectKeys[0]}-1234-description (feature/bugfix/hotfix/release/chore prefix required)`;
    case 'commit':
      return `${CONFIG.projectKeys[0]}-1234-description`;
    default:
      return 'Valid format required';
  }
}

/**
 * Validate basic format patterns
 */
function validateFormat(name, type) {
  const pattern = PATTERNS[type];
  if (!pattern) return { valid: false, message: 'Unknown validation type' };
  
  const match = name.match(pattern);
  if (!match) {
    return {
      valid: false,
      message: `❌ Invalid ${type} format. Expected: ${getExpectedFormat(type)}`
    };
  }
  
  const ticketId = extractTicketId(name);
  if (!ticketId) {
    return {
      valid: false,
      message: `❌ No valid ticket ID found in ${type}`
    };
  }
  
  const projectKey = ticketId.split('-')[0];
  if (!CONFIG.projectKeys.includes(projectKey)) {
    return {
      valid: false,
      message: `❌ Invalid project key '${projectKey}'. Valid keys: ${CONFIG.projectKeys.join(', ')}`
    };
  }
  
  return {
    valid: true,
    message: `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} format is valid`,
    ticketId: ticketId,
    projectKey: projectKey
  };
}

/**
 * Validate branch name format
 */
function validateBranchName(branchName) {
  console.log(`🎫 Validating branch: ${branchName}`);
  
  // Skip validation if disabled
  if (CONFIG.skipValidation) {
    return {
      valid: true,
      message: '✅ Branch validation skipped (SKIP_VALIDATION=true)',
      skipped: true
    };
  }

  // Basic format validation
  const formatResult = validateFormat(branchName, 'branch');
  if (!formatResult.valid) {
    return formatResult;
  }

  // Check description format (lowercase, dashes only)
  const parts = branchName.match(PATTERNS.branch);
  if (parts && parts[4]) {
    const description = parts[4];
    
    // Check for spaces
    if (description.includes(' ')) {
      return {
        valid: false,
        message: '❌ Branch description cannot contain spaces. Use dashes (-) instead',
        suggestion: `${parts[1]}/${parts[2]}-${parts[3]}-${description.replace(/\s+/g, '-')}`
      };
    }
    
    // Check for underscores
    if (description.includes('_')) {
      return {
        valid: false,
        message: '❌ Branch description cannot contain underscores. Use dashes (-) instead',
        suggestion: `${parts[1]}/${parts[2]}-${parts[3]}-${description.replace(/_/g, '-')}`
      };
    }
    
    // Check for uppercase
    if (description !== description.toLowerCase()) {
      return {
        valid: false,
        message: '❌ Branch description must be lowercase',
        suggestion: `${parts[1]}/${parts[2]}-${parts[3]}-${description.toLowerCase()}`
      };
    }
  }

  return {
    valid: true,
    message: `✅ Branch name is valid`,
    ticketId: formatResult.ticketId,
    projectKey: formatResult.projectKey
  };
}

/**
 * Validate commit message format
 */
function validateCommitMessage(commitMessage) {
  console.log(`📝 Validating commit: ${commitMessage}`);
  
  // Skip validation if disabled
  if (CONFIG.skipValidation) {
    return {
      valid: true,
      message: '✅ Commit validation skipped (SKIP_VALIDATION=true)',
      skipped: true
    };
  }

  // Basic format validation
  const formatResult = validateFormat(commitMessage, 'commit');
  if (!formatResult.valid) {
    return formatResult;
  }

  // Check description format (lowercase, dashes only)
  const parts = commitMessage.match(PATTERNS.commit);
  if (parts && parts[3]) {
    const description = parts[3];
    
    // Check for spaces
    if (description.includes(' ')) {
      return {
        valid: false,
        message: '❌ Commit description cannot contain spaces. Use dashes (-) instead',
        suggestion: `${parts[1]}-${parts[2]}-${description.replace(/\s+/g, '-')}`
      };
    }
    
    // Check for underscores  
    if (description.includes('_')) {
      return {
        valid: false,
        message: '❌ Commit description cannot contain underscores. Use dashes (-) instead',
        suggestion: `${parts[1]}-${parts[2]}-${description.replace(/_/g, '-')}`
      };
    }
    
    // Check for uppercase
    if (description !== description.toLowerCase()) {
      return {
        valid: false,
        message: '❌ Commit description must be lowercase',
        suggestion: `${parts[1]}-${parts[2]}-${description.toLowerCase()}`
      };
    }
  }

  return {
    valid: true,
    message: `✅ Commit message is valid`,
    ticketId: formatResult.ticketId,
    projectKey: formatResult.projectKey
  };
}

/**
 * Validate both branch and commit together
 */
function validateBoth(branchName, commitMessage) {
  console.log(`🔄 Validating both branch and commit...`);
  
  const branchResult = validateBranchName(branchName);
  const commitResult = validateCommitMessage(commitMessage);
  
  // Check if ticket IDs match
  if (branchResult.valid && commitResult.valid && 
      branchResult.ticketId && commitResult.ticketId &&
      branchResult.ticketId !== commitResult.ticketId) {
    return {
      valid: false,
      message: `❌ Ticket ID mismatch: Branch has ${branchResult.ticketId}, commit has ${commitResult.ticketId}`,
      branchResult,
      commitResult
    };
  }
  
  return {
    valid: branchResult.valid && commitResult.valid,
    message: branchResult.valid && commitResult.valid 
      ? '✅ Both branch and commit are valid'
      : '❌ Validation failed',
    branchResult,
    commitResult
  };
}

/**
 * Show configuration info
 */
function showConfig() {
  console.log('\n🔧 Validator Configuration:');
  console.log(`📋 Valid Project Keys: ${CONFIG.projectKeys.join(', ')}`);
  console.log(`⏭️  Skip Validation: ${CONFIG.skipValidation}`);
  console.log('\n📝 Expected Formats:');
  console.log(`🌿 Branch: feature/${CONFIG.projectKeys[0]}-1234-description`);
  console.log(`💬 Commit: ${CONFIG.projectKeys[0]}-1234-description`);
  console.log('\n📚 Valid Prefixes: feature/, bugfix/, hotfix/, release/, chore/');
  
  return {
    valid: true,
    config: CONFIG
  };
}

module.exports = {
  validateBranchName,
  validateCommitMessage,
  validateBoth,
  showConfig,
  extractTicketId,
  CONFIG
};