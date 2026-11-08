/**
 * Domain types for DUO Intelligence V1.
 * These describe data shapes only. They do NOT enforce any access control:
 * real authorization must live on the server (RLS + server checks).
 */

export type ID = string;
export type ISODate = string;

export type Visibility = "private" | "shared";

export interface User {
  id: ID;
  displayName: string;
  email: string;
  avatarInitials: string;
  createdAt: ISODate;
}

export interface CoupleSpace {
  id: ID;
  name: string;
  createdAt: ISODate;
  /** V1 rule: at most two members. */
  memberIds: ID[];
  sharedAiStatus: SharedAiStatus;
}

export type SpaceRole = "owner" | "partner";

export interface SpaceMember {
  spaceId: ID;
  userId: ID;
  role: SpaceRole;
  joinedAt: ISODate;
}

export interface Conversation {
  id: ID;
  spaceId: ID;
  title: string;
  visibility: Visibility;
  /** For private conversations: the only owner. For shared: both members. */
  participantIds: ID[];
  createdBy: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Message {
  id: ID;
  conversationId: ID;
  authorId: ID | "assistant";
  body: string;
  createdAt: ISODate;
  /** True for any content produced by the local simulator. */
  simulated?: boolean;
}

export interface Memory {
  id: ID;
  spaceId: ID;
  ownerId: ID | null; // null => shared memory
  visibility: Visibility;
  content: string;
  version: number;
  createdAt: ISODate;
}

export type ProposalDecision = "approved" | "refused";

export interface ProposalApproval {
  userId: ID;
  /** Approvals are bound to a specific version of the proposal. */
  version: number;
  decision: ProposalDecision;
  decidedAt: ISODate;
}

export type ProposalStatus =
  "pending" | "approved_by_me" | "awaiting_other" | "confirmed" | "refused";

export interface MemoryProposal {
  id: ID;
  spaceId: ID;
  proposedBy: ID;
  content: string;
  version: number;
  approvals: ProposalApproval[];
  createdAt: ISODate;
}

export type ConsentScope = "cloud_ai_request" | "shared_memory" | "analytics" | "notifications";

export interface Consent {
  id: ID;
  userId: ID;
  scope: ConsentScope;
  granted: boolean;
  /** Future cloud requests: one consent per request, never blanket. */
  requestId?: ID;
  recipient?: string;
  dataSummary?: string;
  decidedAt: ISODate;
}

export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: ID;
  spaceId: ID;
  title: string;
  assigneeId: ID | null;
  visibility: Visibility;
  status: TaskStatus;
  dueDate?: ISODate;
  projectId?: ID;
}

export interface Project {
  id: ID;
  spaceId: ID;
  name: string;
  description: string;
  visibility: Visibility;
  progress: number; // 0..100
  color: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
}

export interface CalendarEvent {
  id: ID;
  spaceId: ID;
  title: string;
  start: ISODate;
  end: ISODate;
  visibility: Visibility;
  ownerId: ID;
}

export type AuditAction =
  | "shared_ai.suspended"
  | "shared_ai.reactivation_requested"
  | "shared_ai.reactivated"
  | "conversation.shared_created"
  | "memory_proposal.created"
  | "memory_proposal.decided"
  | "task.updated";

export interface AuditEvent {
  id: ID;
  spaceId: ID;
  actorId: ID;
  action: AuditAction;
  createdAt: ISODate;
  summary: string;
}

export interface SharedAiStatus {
  suspended: boolean;
  suspendedAt?: ISODate;
  suspendedBy?: ID;
  /** Users who approved reactivation since the last suspension. */
  reactivationApprovals: ID[];
}

export type AssistantMode = "support" | "organization" | "ideas" | "analysis";
export type AssistantScope = "personal" | "shared";

/* ---------- Lot 1 : types complémentaires (V1) ---------- */

export interface ShoppingItem {
  id: ID;
  spaceId: ID;
  label: string;
  quantity?: string;
  checked: boolean;
  addedBy: ID;
  createdAt: ISODate;
  /** Liste de courses : toujours commune en V1. */
  visibility: "shared";
}

export interface Reminder {
  id: ID;
  spaceId: ID;
  ownerId: ID;
  title: string;
  dueAt: ISODate;
  visibility: Visibility;
  done: boolean;
}

export type NotificationKind = "reminder" | "task" | "shopping" | "memory_proposal" | "shared_ai" | "event_shared";

export interface AppNotification {
  id: ID;
  spaceId: ID;
  recipientId: ID;
  kind: NotificationKind;
  title: string;
  createdAt: ISODate;
  readAt?: ISODate;
}

/** Module automobile commun. Volontairement sans OBD, carburant, péages ni stationnement. */
export interface Vehicle {
  id: ID;
  spaceId: ID;
  name: string;
  plate?: string;
  mileageKm?: number;
  visibility: "shared";
}

export type VehicleMaintenanceKind = "revision" | "controle_technique" | "pneus" | "assurance" | "reparation" | "autre";

export interface VehicleMaintenance {
  id: ID;
  vehicleId: ID;
  kind: VehicleMaintenanceKind;
  date: ISODate;
  mileageKm?: number;
  note?: string;
}

export interface HomeItem {
  id: ID;
  spaceId: ID;
  name: string;
  room?: string;
  visibility: "shared";
}

export interface HomeMaintenance {
  id: ID;
  homeItemId: ID;
  title: string;
  date: ISODate;
  nextDue?: ISODate;
  note?: string;
}

/** Métadonnées uniquement : aucun contenu de fichier stocké en V1. */
export interface DocumentMeta {
  id: ID;
  spaceId: ID;
  ownerId: ID;
  name: string;
  mimeType: string;
  sizeBytes: number;
  visibility: Visibility;
  createdAt: ISODate;
}

export type TrashableType = "task" | "event" | "document" | "shopping" | "reminder" | "conversation" | "memory";

export interface TrashEntry {
  id: ID;
  spaceId: ID;
  ownerId: ID;
  itemType: TrashableType;
  itemId: ID;
  visibility: Visibility;
  deletedAt: ISODate;
}

export interface Device {
  id: ID;
  userId: ID;
  label: string;
  active: boolean;
  lastSeenAt: ISODate;
}

export interface Backup {
  id: ID;
  userId: ID;
  target: "local" | "cloud";
  createdAt: ISODate;
  sizeBytes: number;
  encrypted: boolean;
}

export type DashboardWidget =
  | "agenda_today"
  | "tasks"
  | "shopping"
  | "reminders"
  | "garage"
  | "home"
  | "projects"
  | "recent_documents";

export interface DashboardLayout {
  userId: ID;
  widgets: DashboardWidget[];
}

/** Partage volontaire d'un événement personnel (révocable). */
export interface EventShare {
  eventId: ID;
  sharedBy: ID;
  sharedAt: ISODate;
}
