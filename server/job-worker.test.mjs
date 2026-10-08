import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, rm, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { validateEdits, parseModelResponse, safeDestination } from '../scripts/renso-worker.mjs';

test('worker accepts bounded text edits and fenced JSON', () => {
  const value = { summary: 'Improve music controls', files: [{ path: 'src/AudioPanel.tsx', content: 'export const value = 1;' }] };
  assert.deepEqual(parseModelResponse('```json\n' + JSON.stringify(value) + '\n```'), value);
});
test('worker rejects traversal, credentials, execution configuration and security modules', () => {
  for (const name of ['src/../server/app.mjs', '.env', '.github/workflows/a.yml', 'scripts/a.mjs', 'api/jobs.js', 'package.json', 'server/app.mjs', 'server/store.mjs', 'server/job-queue.mjs', 'server/provider.mjs', 'src/.env.json', 'src//a.ts', '/src/a.ts']) {
    assert.throws(() => validateEdits({ files: [{ path: name, content: 'text' }] }), name);
  }
});
test('worker rejects duplicate files, empty edits, binaries and oversized payloads', () => {
  const file = { path: 'src/a.ts', content: 'ok' };
  for (const files of [[], Array(9).fill(file), [file, file], [{ ...file, content: '\0binary' }], [{ ...file, content: 'é'.repeat(50_001) }]]) assert.throws(() => validateEdits({ files }));
  assert.throws(() => parseModelResponse('not JSON'));
  assert.throws(() => parseModelResponse(' '.repeat(150_001)));
});
test('worker refuses symlink destinations and paths outside the repository', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'renso-worker-'));
  try {
    await mkdir(path.join(root, 'src'));
    await symlink(os.tmpdir(), path.join(root, 'src', 'escape'));
    await assert.rejects(safeDestination(root, 'src/escape/a.ts'), /Unsafe/);
    await assert.rejects(safeDestination(root, '../outside.ts'), /escapes/);
    assert.equal(await safeDestination(root, 'src/new/a.ts'), path.join(root, 'src/new/a.ts'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('apply records newly created files in review diff and refuses an unchanged result', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'renso-worker-apply-'));
  const script = new URL('../scripts/renso-worker.mjs', import.meta.url).pathname;
  try {
    execFileSync('git', ['init', '-q'], { cwd: root });
    await writeFile(path.join(root, 'renso-edits.json'), JSON.stringify({ files: [{ path: 'src/new.ts', content: 'export const example = 1;\n' }] }));
    execFileSync(process.execPath, [script, 'apply'], { cwd: root });
    assert.match(await readFile(path.join(root, 'renso-review.diff'), 'utf8'), /new file mode 100644/);
    execFileSync('git', ['-c', 'user.name=Renso Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], { cwd: root });
    assert.throws(() => execFileSync(process.execPath, [script, 'apply'], { cwd: root, stdio: 'pipe' }), /Worker proposed no changes/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
