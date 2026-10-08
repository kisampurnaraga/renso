// Descriptive movement signals only. These are not emotion probabilities.
export function faceQuality(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 10) return false;
  if (landmarks.some(p => !Number.isFinite(p?.x) || !Number.isFinite(p?.y))) return false;
  const xs = landmarks.map(p => p.x), ys = landmarks.map(p => p.y);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  const width = right - left, height = bottom - top;
  const cx = (left + right) / 2, cy = (top + bottom) / 2;
  return left >= .03 && right <= .97 && top >= .03 && bottom <= .97 && width >= .2 && width <= .75 && height >= .25 && height <= .9 && cx >= .22 && cx <= .78 && cy >= .2 && cy <= .8;
}

export function smileMovement(categories) {
  if (!Array.isArray(categories)) return null;
  const left = categories.find(c => c.categoryName === 'mouthSmileLeft')?.score;
  const right = categories.find(c => c.categoryName === 'mouthSmileRight')?.score;
  if (![left, right].every(score => Number.isFinite(score) && score >= 0 && score <= 1)) return null;
  return (left + right) / 2;
}

export function expressionObservation(samples) {
  const valid = samples.filter(s => Number.isFinite(s) && s >= 0 && s <= 1);
  if (valid.length < 20) return 'Ekspresi belum jelas';
  const average = valid.reduce((sum, score) => sum + score, 0) / valid.length;
  // Product heuristic, not a clinically or emotionally validated threshold.
  return average >= .35 ? 'Gerak senyum terlihat' : 'Ekspresi belum jelas';
}

export function boosterForNeed(need) {
  return ({ pause: 'blue', start: 'green', cheerful: 'red' })[need] ?? null;
}
