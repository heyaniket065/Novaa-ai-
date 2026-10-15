import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompanionSystemPrompt,
  validateCodeSafety,
  formatBytes,
  extractCodeBlocks,
} from './rules.ts';
import type { CompanionProfile } from '../types/index.ts';

test('buildCompanionSystemPrompt generates profile with active memories', () => {
  const profile: CompanionProfile = {
    name: 'Nova',
    avatarStyle: 'nova_core',
    personality: 'coding_expert',
    tone: 'analytical',
    voice: 'Zephyr',
    speechRate: 1.0,
    pitch: 1.0,
    memoryEnabled: true,
    memories: [
      {
        id: '1',
        key: 'preferred_lang',
        content: 'Prefers TypeScript and Python',
        category: 'preference',
        createdAt: '2026-10-15',
        enabled: true,
      },
      {
        id: '2',
        key: 'inactive_memory',
        content: 'Should not appear',
        category: 'general',
        createdAt: '2026-10-15',
        enabled: false,
      },
    ],
  };

  const prompt = buildCompanionSystemPrompt(profile);
  assert.ok(prompt.includes('principal software architect'));
  assert.ok(prompt.includes('Response Tone: ANALYTICAL'));
  assert.ok(prompt.includes('Prefers TypeScript and Python'));
  assert.ok(!prompt.includes('Should not appear'));
});

test('validateCodeSafety detects dangerous calls in Python and JS', () => {
  const safePy = 'print("Hello world")\nx = [i**2 for i in range(10)]\nprint(x)';
  assert.equal(validateCodeSafety(safePy, 'python').safe, true);

  const dangerousPy = 'import os\nos.system("rm -rf /")';
  const pyCheck = validateCodeSafety(dangerousPy, 'python');
  assert.equal(pyCheck.safe, false);
  assert.ok(pyCheck.reason?.includes('Disallowed pattern'));

  const safeJS = 'const nums = [1, 2, 3]; console.log(nums.reduce((a, b) => a + b, 0));';
  assert.equal(validateCodeSafety(safeJS, 'javascript').safe, true);

  const dangerousJS = 'const cp = require("child_process"); cp.execSync("whoami");';
  const jsCheck = validateCodeSafety(dangerousJS, 'javascript');
  assert.equal(jsCheck.safe, false);
});

test('formatBytes properly converts byte counts', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(5242880), '5 MB');
});

test('extractCodeBlocks extracts markdown syntax blocks', () => {
  const md = `# Title
Here is some code:
\`\`\`python
def add(a, b):
    return a + b
\`\`\`
And JavaScript:
\`\`\`javascript
console.log("hello");
\`\`\`
`;
  const blocks = extractCodeBlocks(md);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].language, 'python');
  assert.ok(blocks[0].code.includes('def add(a, b):'));
  assert.equal(blocks[1].language, 'javascript');
  assert.ok(blocks[1].code.includes('console.log'));
});
