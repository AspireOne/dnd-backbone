export type RunStatus =
  | "queued"
  | "in_progress"
  | "requires_action"
  | "cancelling"
  | "cancelled"
  | "failed"
  | "completed"
  | "expired";
export type ResolvedRunStatus =
  | "requires_action"
  | "cancelled"
  | "failed"
  | "completed"
  | "expired";
