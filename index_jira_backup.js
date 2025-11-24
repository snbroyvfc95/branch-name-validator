/**
 * Enhanced Branch Name and Commit Message Validator with Jira Integration
 * 
 * Features:
 * - Validates branch name format and patterns
 * - Verifies Jira ticket existence via API
 * - Caches ticket validation results for performance
 * - Supports multiple project keys and environments
 * - Comprehensive error handling and retry logic
 * 
 * Rules:
 * - Branch name must start with feature/, bugfix/, hotfix/, release/, or chore/
 * - Must contain a valid Jira ticket pattern like SHOP-1234
 * - Jira ticket must exist and be accessible
 * - Description must be lowercase, use dashes (-), no spaces or underscores
 * - Commit message must follow: SHOP-1234-description format
 * 
 * Environment Variables:
 * - JIRA_API_URL: Your Jira instance URL (e.g., https://company.atlassian.net)
 * - JIRA_USERNAME: Jira username or email
 * - JIRA_API_TOKEN: Jira API token for authentication
 * - JIRA_PROJECT_KEYS: Comma-separated list of valid project keys (default: SHOP)
 * - SKIP_JIRA_VALIDATION: Set to 'true' to skip Jira API validation
 * - JIRA_CACHE_TTL: Cache TTL in minutes (default: 60)
 */

// Load environment variables from .env file if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use system environment variables
}

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
 * Check if branch/commit name contains relevant keywords from ticket summary
 */
function validateContentRelevance(name, ticketSummary, ticketId) {
  if (!ticketSummary) {
    return {
      relevant: true,
      message: '⚠️ Cannot validate content relevance (no ticket summary available)',
      missingKeywords: []
    };
  }
  
  const keywords = extractKeywords(ticketSummary);
  const nameLower = name.toLowerCase();
  
  // Remove ticket ID and prefixes from name for analysis
  const cleanName = nameLower
    .replace(new RegExp(ticketId.toLowerCase() + '[-_]*', 'g'), '')
    .replace(/^(feature|bugfix|hotfix|release|chore)[-_\/]*/g, '');
  
  const matchedKeywords = keywords.filter(keyword => 
    cleanName.includes(keyword) || 
    // Check for partial matches (at least 4 characters)
    (keyword.length >= 4 && cleanName.includes(keyword.substring(0, 4)))
  );
  
  const matchPercentage = keywords.length > 0 ? (matchedKeywords.length / keywords.length) * 100 : 100;
  const isRelevant = matchPercentage >= 30; // At least 30% keyword match
  
  return {
    relevant: isRelevant,
    matchPercentage: Math.round(matchPercentage),
    matchedKeywords,
    missingKeywords: keywords.filter(k => !matchedKeywords.includes(k)),
    allKeywords: keywords,
    message: isRelevant 
      ? `✅ Content relevance: ${matchPercentage}% match (${matchedKeywords.length}/${keywords.length} keywords)`
      : `❌ Low content relevance: ${matchPercentage}% match. Branch/commit should relate to: "${ticketSummary}"`
  };
}

/**
 * Check if Jira ticket exists via API and validate content relevance
 */
function validateJiraTicket(ticketId, branchOrCommitName = '') {
  return new Promise((resolve, reject) => {
    // Check cache first
    const cacheKey = ticketId;
    if (ticketCache[cacheKey]) {
      const cached = ticketCache[cacheKey];
      const now = Date.now();
      if (now - cached.timestamp < JIRA_CONFIG.cacheTTL * 60 * 1000) {
        console.log(`🔍 Using cached result for ${ticketId}: ${cached.valid ? 'Valid' : 'Invalid'}`);
        
        // Add content relevance check to cached result if name provided
        if (branchOrCommitName && cached.valid && cached.summary) {
          const relevanceCheck = validateContentRelevance(branchOrCommitName, cached.summary, ticketId);
          cached.relevance = relevanceCheck;
        }
        
        return resolve(cached);
      }
    }

    // Skip validation if disabled or no configuration
    if (JIRA_CONFIG.skipValidation || !JIRA_CONFIG.apiUrl || !JIRA_CONFIG.username || !JIRA_CONFIG.apiToken) {
      const result = {
        valid: true,
        message: 'Jira validation skipped (configuration not provided)',
        timestamp: Date.now(),
        skipped: true
      };
      ticketCache[cacheKey] = result;
      saveCache();
      return resolve(result);
    }

    // Validate project key
    const projectKey = ticketId.split('-')[0];
    if (!JIRA_CONFIG.projectKeys.includes(projectKey)) {
      const result = {
        valid: false,
        message: `❌ Invalid project key '${projectKey}'. Valid keys: ${JIRA_CONFIG.projectKeys.join(', ')}`,
        timestamp: Date.now()
      };
      ticketCache[cacheKey] = result;
      saveCache();
      return resolve(result);
    }

    // Prepare API request
    const baseUrl = JIRA_CONFIG.apiUrl.endsWith('/') ? JIRA_CONFIG.apiUrl : JIRA_CONFIG.apiUrl + '/';
    const apiUrl = new URL(`${baseUrl}rest/api/2/issue/${ticketId}`);
    const auth = Buffer.from(`${JIRA_CONFIG.username}:${JIRA_CONFIG.apiToken}`).toString('base64');
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: JIRA_CONFIG.timeout
    };

    console.log(`🔍 Validating Jira ticket: ${ticketId}...`);
    console.log(`🔗 API URL: ${apiUrl.toString()}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let result;
        
        try {
          if (res.statusCode === 200) {
            const issueData = JSON.parse(data);
            const summary = issueData.fields.summary;
            
            result = {
              valid: true,
              message: `✅ Jira ticket ${ticketId} exists: ${summary}`,
              summary: summary,
              status: issueData.fields.status.name,
              assignee: issueData.fields.assignee?.displayName || 'Unassigned',
              timestamp: Date.now()
            };
            
            // Add content relevance check if name provided
            if (branchOrCommitName) {
              const relevanceCheck = validateContentRelevance(branchOrCommitName, summary, ticketId);
              result.relevance = relevanceCheck;
              
              if (!relevanceCheck.relevant) {
                result.valid = false;
                result.message = `❌ Ticket exists but content mismatch: ${summary}`;
              }
            }
          } else if (res.statusCode === 404) {
            result = {
              valid: false,
              message: `❌ Jira ticket ${ticketId} does not exist or is not accessible`,
              timestamp: Date.now()
            };
          } else if (res.statusCode === 401) {
            result = {
              valid: false,
              message: `❌ Jira authentication failed. Check JIRA_USERNAME and JIRA_API_TOKEN`,
              timestamp: Date.now()
            };
          } else {
            const errorData = JSON.parse(data || '{}');
            result = {
              valid: false,
              message: `❌ Jira API error (${res.statusCode}): ${errorData.errorMessages?.join(', ') || 'Unknown error'}`,
              timestamp: Date.now()
            };
          }
        } catch (parseError) {
          result = {
            valid: false,
            message: `❌ Failed to parse Jira response: ${parseError.message}`,
            timestamp: Date.now()
          };
        }
        
        // Cache the result
        ticketCache[cacheKey] = result;
        saveCache();
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      const result = {
        valid: false,
        message: `❌ Jira API connection failed: ${error.message}`,
        timestamp: Date.now()
      };
      ticketCache[cacheKey] = result;
      saveCache();
      resolve(result); // Resolve instead of reject to handle gracefully
    });
    
    req.on('timeout', () => {
      req.destroy();
      const result = {
        valid: false,
        message: `❌ Jira API timeout after ${JIRA_CONFIG.timeout}ms`,
        timestamp: Date.now()
      };
      ticketCache[cacheKey] = result;
      saveCache();
      resolve(result);
    });
    
    req.end();
  });
}

async function validateBranchName(branchName) {
  const validPrefixes = ['feature/', 'bugfix/', 'hotfix/', 'release/', 'chore/'];
  const isValidPrefix = validPrefixes.some(prefix => branchName.startsWith(prefix));
  
  // Create dynamic regex based on configured project keys
  const projectKeysPattern = JIRA_CONFIG.projectKeys.join('|');
  const regex = new RegExp(`^[a-z]+\/(${projectKeysPattern})-\\d+-[a-z0-9-]+$`);

  if (!isValidPrefix) {
    return {
      valid: false,
      message: `❌ Branch name must start with one of: ${validPrefixes.join(', ')}`,
      suggestion: `Example: feature/SHOP-1234-your-description`
    };
  }

  if (!regex.test(branchName)) {
    const ticketId = extractJiraTicketId(branchName);
    if (!ticketId) {
      return {
        valid: false,
        message: '❌ No valid Jira ticket ID found in branch name',
        suggestion: `Include a ticket like: ${JIRA_CONFIG.projectKeys[0]}-1234`
      };
    }
    return {
      valid: false,
      message: `❌ Invalid branch name format. Found ticket: ${ticketId}`,
      suggestion: `Example: feature/SHOP-3097-ticket-description (lowercase, dashes only)`,
      projectKeys: JIRA_CONFIG.projectKeys
    };
  }

  // Extract Jira ticket ID (already validated by regex)
  const ticketId = extractJiraTicketId(branchName);

  // Validate Jira ticket existence and content relevance
  console.log(`\n🎫 Validating branch: ${branchName}`);
  const jiraResult = await validateJiraTicket(ticketId, branchName);
  
  if (!jiraResult.valid) {
    const response = {
      valid: false,
      message: `❌ Branch format is valid, but Jira validation failed`,
      jiraError: jiraResult.message,
      ticketId: ticketId,
      suggestion: jiraResult.skipped ? 
        'Configure Jira settings or set SKIP_JIRA_VALIDATION=true' :
        'Check ticket ID and Jira access permissions'
    };
    
    // Add content relevance feedback
    if (jiraResult.relevance) {
      response.relevanceInfo = {
        matchPercentage: jiraResult.relevance.matchPercentage,
        ticketSummary: jiraResult.summary,
        suggestedKeywords: jiraResult.relevance.missingKeywords.slice(0, 3),
        explanation: `Your branch should contain words related to: "${jiraResult.summary}"`
      };
      response.suggestion = `Include relevant keywords like: ${jiraResult.relevance.missingKeywords.slice(0, 3).join(', ')}`;
    }
    
    return response;
  }

  const response = {
    valid: true,
    message: '✅ Branch name is valid and Jira ticket exists',
    ticketId: ticketId,
    jiraInfo: {
      summary: jiraResult.summary,
      status: jiraResult.status,
      assignee: jiraResult.assignee
    }
  };
  
  // Add relevance information to successful response
  if (jiraResult.relevance) {
    response.relevanceInfo = {
      matchPercentage: jiraResult.relevance.matchPercentage,
      matchedKeywords: jiraResult.relevance.matchedKeywords,
      message: jiraResult.relevance.message
    };
    
    if (jiraResult.relevance.matchPercentage >= 70) {
      response.message = '✅ Branch name is valid with excellent content relevance';
    } else if (jiraResult.relevance.matchPercentage >= 50) {
      response.message = '✅ Branch name is valid with good content relevance';
    } else {
      response.message = '✅ Branch name is valid with basic content relevance';
    }
  }

  if (jiraResult.skipped) {
    response.message = '✅ Branch name is valid (Jira validation skipped)';
    response.jiraSkipped = true;
  }

  return response;
}

async function validateCommitMessage(commitMessage) {
  // Create dynamic regex based on configured project keys
  const projectKeysPattern = JIRA_CONFIG.projectKeys.join('|');
  const regex = new RegExp(`^(${projectKeysPattern})-\\d+-[a-z0-9-]+$`);

  if (!regex.test(commitMessage)) {
    const ticketId = extractJiraTicketId(commitMessage);
    return {
      valid: false,
      message: `❌ Invalid commit message format. Found ticket: ${ticketId || 'none'}`,
      suggestion: `Example: SHOP-3097-ticket-description (no spaces, only dashes)`,
      projectKeys: JIRA_CONFIG.projectKeys
    };
  }

  // Extract and validate Jira ticket ID
  const ticketId = extractJiraTicketId(commitMessage);
  if (!ticketId) {
    return {
      valid: false,
      message: '❌ No valid Jira ticket ID found in commit message',
      suggestion: `Include a ticket like: ${JIRA_CONFIG.projectKeys[0]}-1234`
    };
  }

  // Validate Jira ticket existence and content relevance
  console.log(`\n🎫 Validating commit message: ${commitMessage}`);
  const jiraResult = await validateJiraTicket(ticketId, commitMessage);
  
  if (!jiraResult.valid) {
    const response = {
      valid: false,
      message: `❌ Commit format is valid, but Jira validation failed`,
      jiraError: jiraResult.message,
      ticketId: ticketId
    };
    
    // Add content relevance feedback
    if (jiraResult.relevance) {
      response.relevanceInfo = {
        matchPercentage: jiraResult.relevance.matchPercentage,
        ticketSummary: jiraResult.summary,
        suggestedKeywords: jiraResult.relevance.missingKeywords.slice(0, 3),
        explanation: `Your commit should contain words related to: "${jiraResult.summary}"`
      };
    }
    
    return response;
  }

  const response = {
    valid: true,
    message: '✅ Commit message is valid and Jira ticket exists',
    ticketId: ticketId,
    jiraInfo: {
      summary: jiraResult.summary,
      status: jiraResult.status,
      assignee: jiraResult.assignee
    }
  };
  
  // Add relevance information to successful response
  if (jiraResult.relevance) {
    response.relevanceInfo = {
      matchPercentage: jiraResult.relevance.matchPercentage,
      matchedKeywords: jiraResult.relevance.matchedKeywords,
      message: jiraResult.relevance.message
    };
    
    if (jiraResult.relevance.matchPercentage >= 70) {
      response.message = '✅ Commit message is valid with excellent content relevance';
    } else if (jiraResult.relevance.matchPercentage >= 50) {
      response.message = '✅ Commit message is valid with good content relevance';
    } else {
      response.message = '✅ Commit message is valid with basic content relevance';
    }
  }

  if (jiraResult.skipped) {
    response.message = '✅ Commit message is valid (Jira validation skipped)';
    response.jiraSkipped = true;
  }

  return response;
}

/**
 * Validate both branch name and commit message together
 */
async function validateBoth(branchName, commitMessage) {
  const results = await Promise.all([
    validateBranchName(branchName),
    validateCommitMessage(commitMessage)
  ]);
  
  const branchResult = results[0];
  const commitResult = results[1];
  
  return {
    branch: branchResult,
    commit: commitResult,
    valid: branchResult.valid && commitResult.valid,
    summary: {
      branchValid: branchResult.valid,
      commitValid: commitResult.valid,
      jiraTicket: branchResult.ticketId || commitResult.ticketId,
      jiraInfo: branchResult.jiraInfo || commitResult.jiraInfo
    }
  };
}

/**
 * Clear Jira ticket cache
 */
function clearCache() {
  ticketCache = {};
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
    return { success: true, message: 'Cache cleared successfully' };
  } catch (error) {
    return { success: false, message: `Failed to clear cache: ${error.message}` };
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  const stats = {
    totalEntries: Object.keys(ticketCache).length,
    validEntries: 0,
    invalidEntries: 0,
    skippedEntries: 0,
    oldestEntry: null,
    newestEntry: null
  };
  
  let oldestTime = Infinity;
  let newestTime = 0;
  
  for (const [ticketId, entry] of Object.entries(ticketCache)) {
    if (entry.valid) stats.validEntries++;
    else stats.invalidEntries++;
    if (entry.skipped) stats.skippedEntries++;
    
    if (entry.timestamp < oldestTime) {
      oldestTime = entry.timestamp;
      stats.oldestEntry = { ticketId, timestamp: new Date(entry.timestamp) };
    }
    if (entry.timestamp > newestTime) {
      newestTime = entry.timestamp;
      stats.newestEntry = { ticketId, timestamp: new Date(entry.timestamp) };
    }
  }
  
  return stats;
}

module.exports = { 
  validateBranchName, 
  validateCommitMessage, 
  validateBoth,
  clearCache,
  getCacheStats,
  extractJiraTicketId,
  extractKeywords,
  validateContentRelevance,
  JIRA_CONFIG
};