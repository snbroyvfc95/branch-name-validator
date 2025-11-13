/**
Validate branch name and commit message
 *
Rules:
 - Branch name must start with feature/, bugfix/, or hotfix/
 - Must contain a Jira ticket pattern like SHOP-1234
 - Description must be lowercase, use dashes (-), no spaces or underscores
 - Commit message must also follow: SHOP-1234-description
  */

function validateBranchName(branchName) {
  const validPrefixes = ['feature/', 'bugfix/', 'hotfix/'];
  const isValidPrefix = validPrefixes.some(prefix => branchName.startsWith(prefix));
  const regex = /^[a-z]+\/SHOP-\d+-[a-z0-9-]+$/;

  if (!isValidPrefix) {
    return {
      valid: false,
      message: `❌ Branch name must start with one of: ${validPrefixes.join(', ')}`
    };
  }

  if (!regex.test(branchName)) {
    return {
      valid: false,
      message: ':x: Invalid branch name. Example: feature/SHOP-3097-ticket-description (no spaces, only dashes).'
    };
  }

  return { valid: true, message: ':white_check_mark: Branch name is valid.' };
}

function validateCommitMessage(commitMessage) {
  const regex = /^SHOP-\d+-[a-z0-9-]+$/;

  if (!regex.test(commitMessage)) {
    return {
      valid: false,
      message: ':x: Invalid commit message. Example: SHOP-3097-ticket-description (no spaces, only dashes).'
    };
  }

  return { valid: true, message: ':white_check_mark: Commit message is valid.' };
}

module.exports = { validateBranchName, validateCommitMessage };