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
