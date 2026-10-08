export type WorkspaceDivisionId = 'engineering' | 'wellbeing' | 'creative' | 'growth'
export type Localized = { id: string; en: string }

export type WorkspaceTeam = {
  id: string
  agentName: string
  divisionId: WorkspaceDivisionId
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

export const TEAM_DIVISIONS: {id:WorkspaceDivisionId;name:Localized}[];
