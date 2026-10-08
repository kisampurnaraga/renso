import { useEffect, useRef, useState } from 'react';
import { TEAM_WORKSPACE } from './team-workspace-data';

type Props = { teamId: string; language: 'id' | 'en'; suggestedInstructions: string };
type Job = { id: string; team: string; title: string; instructions: string; status: string; createdAt?: string; updatedAt?: string; runUrl?: string | null; prUrl?: string | null; created_at?: string; updated_at?: string; run_url?: string | null; pr_url?: string | null; error?: string | null };
type OwnerStatus = { configured: boolean; authenticated: boolean; workerConfigured: boolean; databaseConfigured: boolean };
const statusNames: Record<string, [string, string]> = {
  queued: ['Antrean', 'Queued'], dispatching: ['Menghubungkan worker', 'Contacting worker'],
  dispatched: ['Menunggu worker', 'Waiting for worker'], running: ['Dikerjakan worker', 'Worker running'],
  review_ready: ['Siap ditinjau', 'Ready for review'], failed: ['Gagal', 'Failed'], dispatch_failed: ['Pengiriman gagal', 'Dispatch failed'],
};
function evidenceUrl(value?: string | null) {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'github.com' ? url.href : undefined; } catch { return undefined; }
}

export default function TeamJobQueue({ teamId, language, suggestedInstructions }: Props) {
  const english = language === 'en';
  const [owner, setOwner] = useState<OwnerStatus | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [password, setPassword] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { title: string; instructions: string }>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const alive = useRef(true);
  const request = useRef<AbortController | null>(null);
  const team = TEAM_WORKSPACE.teams.find(item => item.id === teamId)!;
  const draft = drafts[teamId] || { title: '', instructions: '' };
  function edit(field: 'title' | 'instructions', value: string) {
    setDrafts(previous => ({ ...previous, [teamId]: { ...(previous[teamId] || { title: '', instructions: '' }), [field]: value } }));
  }
  async function call(path: string, body?: unknown) {
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`/api/${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(english ? `Task service unavailable (HTTP ${response.status}).` : `Layanan tugas belum tersedia (HTTP ${response.status}).`);
      let data;
      try { data = await response.json(); } catch { throw new Error(english ? 'Task response could not be read.' : 'Respons layanan tugas belum bisa dibaca.'); }
      if (!data || typeof data !== 'object') throw new Error(english ? 'Invalid task response.' : 'Respons layanan tugas belum sesuai.');
      if (!response.ok) { if (response.status === 401 && alive.current) { setOwner(previous => previous ? { ...previous, authenticated: false } : previous); setJobs([]); } throw new Error(typeof data.error === 'string' ? data.error : english ? 'Task service unavailable.' : 'Layanan tugas belum tersedia.'); }
      return data;
    } finally { clearTimeout(timer); }
  }
  async function refresh() {
    const status = await call('owner-status');
    if (typeof (status.ownerConfigured ?? status.configured) !== 'boolean' || typeof status.authenticated !== 'boolean') throw new Error(english ? 'Invalid owner status.' : 'Status pemilik belum sesuai.');
    if (alive.current) setOwner({ configured: status.ownerConfigured ?? status.configured, authenticated: status.authenticated, workerConfigured: status.dispatcherConfigured ?? status.workerConfigured ?? false, databaseConfigured: status.databaseConfigured ?? true });
    if (status.authenticated) {
      const result = await call('jobs');
      if (!Array.isArray(result.jobs)) throw new Error(english ? 'Invalid job list.' : 'Daftar tugas belum sesuai.');
      if (alive.current) setJobs(result.jobs);
    } else if (alive.current) setJobs([]);
  }
  async function operate(label: string, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(label); setError(''); setNotice('');
    try { await action(); } catch (cause) {
      if (alive.current) setError(cause instanceof Error && cause.name !== 'AbortError' ? cause.message : english ? 'Request timed out. Check the task list before retrying.' : 'Permintaan terlalu lama. Periksa daftar tugas sebelum mencoba kembali.');
    } finally { lock.current = false; if (alive.current) setBusy(''); }
  }
  useEffect(() => {
    let active = true; alive.current = true;
    queueMicrotask(() => { if (active) void operate('load', refresh); });
    return () => { active = false; alive.current = false; request.current?.abort(); };
  }, []);
  const disabled = Boolean(busy);
  return <section className="team-job-queue" aria-labelledby="team-jobs-title">
    <div className="team-jobs-heading"><div><p className="team-eyebrow">{english ? 'OWNER WORKSPACE' : 'RUANG KERJA PEMILIK'}</p><h2 id="team-jobs-title">{english ? 'Assign real work' : 'Tugaskan pekerjaan nyata'}</h2><p>{english ? 'Save a task, send it to the worker, then review its evidence and draft pull request.' : 'Simpan tugas, kirim ke worker, lalu tinjau bukti dan draft pull request hasilnya.'}</p></div><button disabled={disabled} onClick={() => void operate('refresh', refresh)}>{english ? 'Refresh tasks' : 'Perbarui tugas'}</button></div>
    {busy ? <p role="status">{english ? 'Connecting…' : 'Menghubungkan…'}</p> : null}
    {error ? <p className="agent-chat-error" role="alert">{error}</p> : null}
    {notice ? <p role="status" className="agent-brief-notice">{notice}</p> : null}
    {owner && !owner.configured ? <p className="team-jobs-setup">{english ? 'Owner access is not configured yet. The server needs OWNER_ACCESS_KEY and the task database migration before assignments can be stored.' : 'Akses pemilik belum dikonfigurasi. Server membutuhkan OWNER_ACCESS_KEY dan migrasi database tugas sebelum penugasan bisa disimpan.'}</p> : null}
    {owner?.configured && !owner.authenticated ? <form className="team-owner-login" onSubmit={event => { event.preventDefault(); const key = password; setPassword(''); void operate('login', async () => { await call('owner-login', { key }); await refresh(); }); }}><label htmlFor="owner-access-key">{english ? 'Owner access key' : 'Kunci akses pemilik'}</label><input id="owner-access-key" type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} maxLength={256} disabled={disabled} required/><button disabled={disabled || !password.trim()}>{english ? 'Sign in as owner' : 'Masuk sebagai pemilik'}</button><small>{english ? 'The key is not saved in this browser. Use the key configured on your server.' : 'Kunci tidak disimpan di browser ini. Gunakan kunci yang dikonfigurasi pada server.'}</small></form> : null}
    {owner?.authenticated ? <>
      <div className="team-owner-session"><span>{english ? 'Owner signed in' : 'Pemilik sudah masuk'}</span><button disabled={disabled} onClick={() => void operate('logout', async () => { await call('owner-logout', {}); setJobs([]); await refresh(); })}>{english ? 'Sign out' : 'Keluar'}</button></div>
      {!owner.databaseConfigured ? <p className="team-jobs-setup">{english ? 'Task database is not configured yet. Complete the task migration before saving.' : 'Database tugas belum dikonfigurasi. Jalankan migrasi tugas sebelum menyimpan.'}</p> : null}
      {!owner.workerConfigured ? <p className="team-jobs-setup">{english ? 'Tasks can be stored. Worker dispatch still needs server configuration and the workflow AI key on GitHub.' : 'Tugas dapat disimpan. Pengiriman ke worker masih memerlukan konfigurasi server dan kunci AI workflow di GitHub.'}</p> : null}
      <form className="team-job-form" onSubmit={event => { event.preventDefault(); const submittedTeam = teamId; void operate('create', async () => { await call('jobs', { team: submittedTeam, title: draft.title.trim(), instructions: draft.instructions.trim() }); setDrafts(previous => ({ ...previous, [submittedTeam]: { title: '', instructions: '' } })); await refresh(); setNotice(english ? 'Task saved in the database. Send it to the worker when ready.' : 'Tugas tersimpan di database. Kirim ke worker jika sudah siap.'); }); }}>
        <p><strong>{english ? 'Assigned team: ' : 'Tim yang ditugaskan: '}{team.name[language]}</strong></p>
        <label htmlFor="job-title">{english ? 'Task title' : 'Judul tugas'}</label><input id="job-title" value={draft.title} maxLength={120} required disabled={disabled} onChange={event => edit('title', event.target.value)} placeholder={english ? 'A specific Renso improvement' : 'Perbaikan Renso yang spesifik'}/>
        <label htmlFor="job-instructions">{english ? 'Instructions and success criteria' : 'Arahan dan kriteria berhasil'}</label><textarea id="job-instructions" rows={5} value={draft.instructions} maxLength={4000} required disabled={disabled} onChange={event => edit('instructions', event.target.value)} placeholder={english ? 'Describe the change, expected behavior, and how to verify it.' : 'Jelaskan perubahan, perilaku yang diharapkan, dan cara memeriksanya.'}/>
        <div className="team-job-actions"><button type="button" disabled={disabled || !suggestedInstructions.trim()} onClick={() => edit('instructions', suggestedInstructions.slice(0,4000))}>{english ? 'Use brief and latest request' : 'Gunakan briefing dan permintaan terakhir'}</button><button type="submit" disabled={disabled || !owner.databaseConfigured || !draft.title.trim() || !draft.instructions.trim()}>{english ? 'Save task' : 'Simpan tugas'}</button></div>
        <small>{english ? 'Review instructions before saving. Saving alone does not start a worker. Code and task instructions can become public in GitHub: keep secrets out. Changes are proposed in a draft PR for review.' : 'Periksa arahan sebelum menyimpan. Penyimpanan saja belum menjalankan worker. Kode dan arahan tugas bisa menjadi publik di GitHub: jangan masukkan secret. Perubahan diajukan melalui draft PR untuk ditinjau.'}</small>
      </form>
      <div className="team-job-list">{jobs.length ? jobs.map(job => <article className="team-job-card" key={job.id}><div className="team-task-meta"><span>{TEAM_WORKSPACE.teams.find(item => item.id === job.team)?.name[language] || job.team}</span><span className="team-badge team-queued">{statusNames[job.status]?.[english ? 1 : 0] || job.status}</span></div><h3>{job.title}</h3><details><summary>{english ? 'View instructions' : 'Lihat arahan'}</summary><p>{job.instructions}</p></details>{job.error ? <p className="agent-chat-error">{job.error}</p> : null}<small>{english ? 'Updated: ' : 'Diperbarui: '}{new Date(job.updatedAt || job.updated_at || '').toLocaleString(english ? 'en-GB' : 'id-ID', { timeZone: 'Asia/Jakarta' })} WIB</small><div className="team-job-actions">{job.status === 'queued' ? <button disabled={disabled || !owner.workerConfigured} onClick={() => void operate('dispatch', async () => { await call('job-dispatch', { id: job.id }); await refresh(); })}>{english ? 'Send to worker' : 'Kirim ke worker'}</button> : null}{job.status !== 'queued' ? <button disabled={disabled} onClick={() => void operate('sync', async () => { await call('job-sync', { id: job.id }); await refresh(); })}>{english ? 'Check worker result' : 'Periksa hasil worker'}</button> : null}{evidenceUrl(job.runUrl || job.run_url) ? <a href={evidenceUrl(job.runUrl || job.run_url)} target="_blank" rel="noopener noreferrer">{english ? 'Worker evidence' : 'Bukti worker'}</a> : null}{evidenceUrl(job.prUrl || job.pr_url) ? <a href={evidenceUrl(job.prUrl || job.pr_url)} target="_blank" rel="noopener noreferrer">{english ? 'Review draft PR' : 'Tinjau draft PR'}</a> : null}</div></article>) : <p>{english ? 'No saved assignments yet.' : 'Belum ada penugasan tersimpan.'}</p>}</div>
    </> : null}
  </section>;
}
