// Presence is a local visualization; worker status alone proves execution.
export function presenceCommand(text) {
  const normalized = text.trim().toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim();
  if (['lanjut kerja', 'kembali bekerja', 'mulai kerja', 'kerja lagi', 'aktif lagi', 'resume', 'back to work', 'continue working'].includes(normalized)) return 'available';
  if (['istirahat', 'istirahat dulu', 'rehat', 'break', 'rest', 'take a break'].includes(normalized)) return 'resting';
  return null;
}

export function officePresence(preference = 'resting', status = 'unknown') {
  if (status === 'running') return 'working';
  if (['queued', 'dispatching', 'dispatched'].includes(status)) return 'waiting';
  return preference === 'available' ? 'available' : 'resting';
}
