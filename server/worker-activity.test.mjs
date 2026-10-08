import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveWorkerActivity } from '../shared/worker-activity.mjs';
test('actual running work wins over queued and completed evidence regardless of order', () => {
  const jobs = [{team:'audio',status:'review_ready'},{team:'audio',status:'running'},{team:'audio',status:'queued'}];
  assert.equal(deriveWorkerActivity(jobs,['audio']).audio,'running');
  assert.equal(deriveWorkerActivity(jobs.reverse(),['audio']).audio,'running');
});
test('waiting and queued work do not become running; private content is not returned', () => {
  assert.deepEqual(deriveWorkerActivity([{team:'backend',status:'dispatched',title:'private'},{team:'audio',status:'queued'},{team:'alien',status:'running'}],['backend','audio','qa']),{backend:'dispatched',audio:'queued',qa:'idle'});
});
test('failed and review-ready states are retained; unknown server status never starts animation', () => {
  assert.deepEqual(deriveWorkerActivity([{team:'qa',status:'failed'},{team:'audio',status:'review_ready'},{team:'backend',status:'chatting'}],['qa','audio','backend']),{qa:'failed',audio:'review_ready',backend:'idle'});
});
