export type WorkActivity = 'design'|'coding'|'writing'|'study'|'other';
export const WORK_ACTIVITIES: Record<WorkActivity,{room:string;assets:string;label:string;icon:string;tip:string}>;
export function detectWorkActivity(text:string): WorkActivity|null;
export function workReply(activity:WorkActivity,mode:'calm'|'cheerful'):string;
