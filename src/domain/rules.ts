/**
 * Pure product rules (UI-side mirror). They drive the prototype's behaviour
 * and are unit-tested, but they are NOT a security boundary: the server must
 * re-implement and enforce every one of them.
 */
import type { ID, MemoryProposal, ProposalStatus, SharedAiStatus } from "./types";

export const MAX_MEMBERS_PER_SPACE = 2;

export function canAddMember(memberIds: ID[]): boolean {
  return memberIds.length < MAX_MEMBERS_PER_SPACE;
}

/** Only approvals bound to the current version count. */
export function currentApprovals(p: MemoryProposal) {
  return p.approvals.filter((a) => a.version === p.version);
}

export function proposalStatus(p: MemoryProposal, meId: ID, partnerId: ID): ProposalStatus {
  const current = currentApprovals(p);
  if (current.some((a) => a.decision === "refused")) return "refused";
  const me = current.some((a) => a.userId === meId && a.decision === "approved");
  const partner = current.some((a) => a.userId === partnerId && a.decision === "approved");
  if (me && partner) return "confirmed";
  if (me) return "approved_by_me";
  if (partner) return "awaiting_other";
  return "pending";
}

/** Active only when both partners approved the same (current) version. */
export function isSharedMemoryActive(p: MemoryProposal, meId: ID, partnerId: ID) {
  return proposalStatus(p, meId, partnerId) === "confirmed";
}

/** Editing a proposal bumps its version, invalidating previous approvals. */
export function editProposal(p: MemoryProposal, content: string): MemoryProposal {
  return { ...p, content, version: p.version + 1 };
}

export function decideProposal(
  p: MemoryProposal,
  userId: ID,
  decision: "approved" | "refused",
  now = new Date().toISOString(),
): MemoryProposal {
  const others = p.approvals.filter((a) => !(a.userId === userId && a.version === p.version));
  return {
    ...p,
    approvals: [...others, { userId, version: p.version, decision, decidedAt: now }],
  };
}

export function suspendSharedAi(_s: SharedAiStatus, by: ID, now = new Date().toISOString()): SharedAiStatus {
  return { suspended: true, suspendedAt: now, suspendedBy: by, reactivationApprovals: [] };
}

/** Reactivation requires both members' approval. */
export function approveReactivation(s: SharedAiStatus, userId: ID, memberIds: ID[]): SharedAiStatus {
  if (!s.suspended) return s;
  const approvals = Array.from(new Set([...s.reactivationApprovals, userId]));
  const all = memberIds.every((m) => approvals.includes(m));
  return all ? { suspended: false, reactivationApprovals: [] } : { ...s, reactivationApprovals: approvals };
}

export function canUseSharedAi(s: SharedAiStatus) {
  return !s.suspended;
}

/** Actions requiring reinforced confirmation (typed phrase). */
export const SENSITIVE_ACTIONS = ["share", "permanent_delete", "permissions", "financial", "contractual"] as const;
export type SensitiveAction = (typeof SENSITIVE_ACTIONS)[number];
export function requiresReinforcedConfirmation(action: string): action is SensitiveAction {
  return (SENSITIVE_ACTIONS as readonly string[]).includes(action);
}
