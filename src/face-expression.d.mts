export function faceQuality(landmarks: readonly { x: number; y: number }[] | undefined): boolean;
export function smileMovement(categories: readonly { categoryName: string; score: number }[] | undefined): number | null;
export function expressionObservation(samples: readonly number[]): 'Gerak senyum terlihat' | 'Ekspresi belum jelas';
export function boosterForNeed(need: string): 'blue' | 'green' | 'red' | null;
