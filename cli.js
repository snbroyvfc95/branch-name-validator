#!/usr/bin/env node
const { validateBranchName, validateCommitMessage } = require('./index');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(':x: Usage: validate-git branch <branch-name> OR validate-git commit <commit-message>');
  process.exit(1);
}

const [type, value] = args;

let result;
if (type === 'branch') {
  result = validateBranchName(value);
} else if (type === 'commit') {
  result = validateCommitMessage(value);
} else {
  console.error(':x: Invalid type. Use "branch" or "commit"');
  process.exit(1);
}

console.log(result.message);
process.exit(result.valid ? 0 : 1);