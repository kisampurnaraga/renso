export type Localized = { id: string; en: string }

export type WorkspaceTeam = {
  id: string
  name: Localized
  role: Localized
  availability: 'on-demand' | 'planned'
}

export type WorkspaceTask = {
  id: string
  teamId: string
  title: Localized
  detail: Localized
  status: 'done' | 'queued' | 'validation'
  updatedAt: string
  evidence: { label: string; url: string }[]
}

export const TEAM_WORKSPACE: {updatedAt:string;teams:WorkspaceTeam[];tasks:WorkspaceTask[]};
