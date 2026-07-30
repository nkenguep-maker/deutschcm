export interface AdminPersonaRow {
  id: string;
  label: string;
  role: string;
  destination: string;
  available: boolean;
}

export interface AdminAuditRow {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorRole: string | null;
  actorHash: string | null;
  createdAt: string;
}

export interface AdminEnvSummary {
  projectRef: string | null;
  nodeEnv: string | null;
  qaModeEnabled: boolean;
  qaSessionMaxMinutes: number;
  flags: Array<{ key: string; enabled: boolean }>;
}
