import test from 'node:test';
import assert from 'node:assert/strict';
import { faceQuality, smileMovement, expressionObservation, boosterForNeed } from '../src/face-expression.mjs';
const face = Array.from({ length: 10 }, (_, i) => ({ x: i % 2 ? .3 : .7, y: i % 2 ? .25 : .75 }));
test('face quality rejects missing, nonfinite, clipped, small and off-center inputs', () => {
  assert.equal(faceQuality(face), true);
  for (const points of [undefined, [], face.map(p => ({ ...p, x: NaN })), face.map(p => ({ ...p, x: p.x + .3 })), face.map(p => ({ x: .5 + (p.x - .5) / 5, y: p.y })), face.map(p => ({ x: p.x < .5 ? .04 : .96, y: p.y })), face.map(p => ({ x: p.x < .5 ? .07 : .31, y: p.y }))]) assert.equal(faceQuality(points), false);
});
test('smile signal requires both valid movement coefficients, never missing as zero', () => {
  assert.equal(smileMovement(undefined), null);
  assert.equal(smileMovement([{ categoryName: 'mouthSmileLeft', score: .8 }]), null);
  assert.equal(smileMovement([{ categoryName: 'mouthSmileLeft', score: NaN }, { categoryName: 'mouthSmileRight', score: .8 }]), null);
  assert.equal(smileMovement([{ categoryName: 'mouthSmileLeft', score: .6 }, { categoryName: 'mouthSmileRight', score: .8 }]), .7);
});
test('observation needs twenty samples and never claims a feeling', () => {
  assert.equal(expressionObservation(Array(19).fill(.8)), 'Ekspresi belum jelas');
  assert.equal(expressionObservation(Array(20).fill(.8)), 'Gerak senyum terlihat');
  assert.equal(expressionObservation(Array(20).fill(.1)), 'Ekspresi belum jelas');
  assert.equal(expressionObservation(Array(20).fill(NaN)), 'Ekspresi belum jelas');
});
test('booster follows explicit user need and unknown need has no suggestion', () => {
  assert.equal(boosterForNeed('pause'), 'blue'); assert.equal(boosterForNeed('start'), 'green'); assert.equal(boosterForNeed('cheerful'), 'red'); assert.equal(boosterForNeed('unknown'), null);
});
