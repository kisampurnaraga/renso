export type WorkerState = 'unknown' | 'idle' | 'queued' | 'dispatching' | 'dispatched' | 'running' | 'review_ready' | 'failed' | 'dispatch_failed';
export type WorkerActivity = Record<string, WorkerState>;
export function deriveWorkerActivity(jobs: Array<{team: string; status: string}>, teamIds: string[]): WorkerActivity;
