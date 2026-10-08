import test from 'node:test';
import assert from 'node:assert/strict';
import {detectWorkActivity} from '../src/work-activity.mjs';
test('activity follows descriptions and explicit corrections',()=>{
  assert.equal(detectWorkActivity('lagi ngedesign poster'),'design');
  assert.equal(detectWorkActivity('bukan desain, lagi coding Python'),'coding');
  assert.equal(detectWorkActivity('lagi menulis caption'),'writing');
  assert.equal(detectWorkActivity('lagi belajar matematika'),'study');
  assert.equal(detectWorkActivity('sedang memasak'),null);
  assert.equal(detectWorkActivity('bukan coding'),null);
});
