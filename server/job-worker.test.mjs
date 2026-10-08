import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, rm, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { validateEdits, parseModelResponse, safeDestination, orderContextFiles, replaceExactly, contextExcerpt } from '../scripts/renso-worker.mjs';

test('small snippet edits preserve unrelated file content and reject ambiguous matches',()=>{
  const edit={path:'src/App.tsx',find:"function musicMood(next){setMood(next);beginWork('cheerful');}",replace:'function musicMood(next){setMood(next);}'};
  assert.deepEqual(validateEdits({files:[edit]}).files,[edit]);
  const original='// keep header\n'+edit.find+'\n// keep footer';
  assert.equal(replaceExactly(original,edit.find,edit.replace),'// keep header\n'+edit.replace+'\n// keep footer');
  assert.throws(()=>replaceExactly('missing',edit.find,edit.replace),/exactly once/);
  assert.throws(()=>replaceExactly(edit.find+'\n'+edit.find,edit.find,edit.replace),/exactly once/);
  assert.throws(()=>validateEdits({files:[{...edit,content:'mixed'}]}));
  assert.throws(()=>validateEdits({files:[{...edit,find:''}]}));
});
test('explicit task file and function receive a bounded context excerpt',()=>{
  assert.equal(orderContextFiles(['src/music-engine.ts','src/App.tsx'],'audio','Fix musicMood in src/App.tsx')[0],'src/App.tsx');
  const source='// unrelated\n'.repeat(1000)+'function musicMood(next){setMood(next);}\n'+'// trailing\n'.repeat(1000);
  const excerpt=contextExcerpt(source,'Fix musicMood in src/App.tsx',4000);
  assert.ok(excerpt.includes('function musicMood'));
  assert.ok(excerpt.length<=4000);
});

test('worker prioritizes task implementation over documentation and excludes protected files', () => {
  const names=['docs/ARCHITECTURE.md','src/App.tsx','src/music-engine.ts','src/MoodRoom.tsx','server/app.mjs','.env','src/Avatar.tsx'];
  const audio=orderContextFiles(names,'audio','Smooth music');
  assert.deepEqual(new Set(audio.slice(0,2)),new Set(['src/music-engine.ts','src/MoodRoom.tsx']));
  assert.ok(audio.indexOf('src/App.tsx')<audio.indexOf('docs/ARCHITECTURE.md'));
  assert.ok(!audio.includes('server/app.mjs')&&!audio.includes('.env'));
  assert.equal(orderContextFiles(names,'visual','Improve avatar')[0],'src/Avatar.tsx');
});

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
