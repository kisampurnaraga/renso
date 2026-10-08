// Only database worker states drive office activity; chat replies never do.
const priority = { running: 6, dispatching: 5, dispatched: 5, queued: 4, review_ready: 3, failed: 2, dispatch_failed: 2 };
export function deriveWorkerActivity(jobs, teamIds) {
  const result = Object.fromEntries(teamIds.map(id => [id, 'idle']));
  for (const job of jobs) {
    if (!Object.hasOwn(result, job.team) || !Object.hasOwn(priority, job.status)) continue;
    if ((priority[job.status] || 0) > (priority[result[job.team]] || 0)) result[job.team] = job.status;
  }
  return result;
}
