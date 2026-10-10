export type PresenceMode = 'resting' | 'available';
export function presenceCommand(text: string): PresenceMode | null;
export function officePresence(preference?: PresenceMode, status?: string): 'working' | 'waiting' | PresenceMode;
