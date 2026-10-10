import test from 'node:test';
import assert from 'node:assert/strict';
import { presenceCommand, officePresence } from '../shared/office-presence.mjs';

test('explicit Indonesian and English office commands are recognized', () => {
  for (const text of ['Istirahat dulu.', 'REHAT!', 'Take a break.', 'rest']) assert.equal(presenceCommand(text), 'resting');
  for (const text of ['Lanjut kerja.', '  Back  to work! ', 'resume']) assert.equal(presenceCommand(text), 'available');
});

test('discussion of rest or negated commands remains an AI conversation', () => {
  for (const text of ['Jangan istirahat dulu', 'Apa manfaat istirahat?', 'Buat tombol lanjut kerja', 'How does rest work?', 'Do not take a break.', 'break down this task', 'rest API', '']) assert.equal(presenceCommand(text), null);
});

test('verified active jobs override rest requests consistently until they finish', () => {
  assert.equal(officePresence('resting', 'running'), 'working');
  for (const status of ['queued', 'dispatching', 'dispatched']) assert.equal(officePresence('resting', status), 'waiting');
  for (const status of ['idle', 'review_ready', 'failed', 'unknown']) assert.equal(officePresence('resting', status), 'resting');
  assert.equal(officePresence('available', 'review_ready'), 'available');
  assert.equal(officePresence(), 'resting');
});
