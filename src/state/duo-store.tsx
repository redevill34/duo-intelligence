/**
 * In-memory prototype state (React context). Nothing is persisted:
 * reloading the page resets the demo. This is NOT a security mechanism.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { MemoryProposal, SharedAiStatus, Task, CalendarEvent, Conversation } from "@/domain/types";
import { approveReactivation, decideProposal, editProposal, suspendSharedAi } from "@/domain/rules";
import * as F from "@/services/demo/fixtures";

interface DuoState {
  me: typeof F.ME;
  partner: typeof F.PARTNER;
  memberIds: string[];
  sharedAi: SharedAiStatus;
  suspendShared: () => void;
  approveReactivationAsMe: () => void;
  simulatePartnerReactivation: () => void;
  /** Register an in-flight shared request so suspension can cancel it. */
  registerSharedRequest: (c: AbortController) => () => void;
  proposals: MemoryProposal[];
  decide: (id: string, decision: "approved" | "refused") => void;
  edit: (id: string, content: string) => void;
  propose: (content: string) => void;
  tasks: Task[];
  setTasks: (fn: (t: Task[]) => Task[]) => void;
  events: CalendarEvent[];
  addEvent: (e: CalendarEvent) => void;
  conversations: Conversation[];
  addSharedConversation: (title: string) => Conversation;
}

const Ctx = createContext<DuoState | null>(null);

export function DuoProvider({ children }: { children: ReactNode }) {
  const memberIds = F.SPACE.memberIds;
  const [sharedAi, setSharedAi] = useState<SharedAiStatus>(structuredClone(F.SPACE.sharedAiStatus));
  const [proposals, setProposals] = useState(() => structuredClone(F.proposals));
  const [tasks, setTasksState] = useState(() => structuredClone(F.tasks));
  const [events, setEvents] = useState(() => structuredClone(F.events));
  const [conversations, setConversations] = useState(() => structuredClone(F.conversations));
  const inflight = useRef(new Set<AbortController>());

  const suspendShared = useCallback(() => {
    inflight.current.forEach((c) => c.abort());
    inflight.current.clear();
    setSharedAi((s) => suspendSharedAi(s, F.ME.id));
  }, []);

  const value = useMemo<DuoState>(() => ({
    me: F.ME, partner: F.PARTNER, memberIds, sharedAi, suspendShared,
    approveReactivationAsMe: () => setSharedAi((s) => approveReactivation(s, F.ME.id, memberIds)),
    simulatePartnerReactivation: () => setSharedAi((s) => approveReactivation(s, F.PARTNER.id, memberIds)),
    registerSharedRequest: (c) => { inflight.current.add(c); return () => inflight.current.delete(c); },
    proposals,
    decide: (id, decision) => setProposals((ps) => ps.map((p) => (p.id === id ? decideProposal(p, F.ME.id, decision) : p))),
    edit: (id, content) => setProposals((ps) => ps.map((p) => (p.id === id ? editProposal(p, content) : p))),
    propose: (content) => setProposals((ps) => [{ id: `p-${Date.now()}`, spaceId: F.SPACE.id, proposedBy: F.ME.id, content, version: 1, approvals: [], createdAt: new Date().toISOString() }, ...ps]),
    tasks, setTasks: (fn) => setTasksState(fn),
    events, addEvent: (e) => setEvents((es) => [...es, e]),
    conversations,
    addSharedConversation: (title) => {
      const now = new Date().toISOString();
      const c: Conversation = { id: `c-${Date.now()}`, spaceId: F.SPACE.id, title, visibility: "shared", participantIds: [F.ME.id, F.PARTNER.id], createdBy: F.ME.id, createdAt: now, updatedAt: now };
      setConversations((cs) => [c, ...cs]);
      return c;
    },
  }), [memberIds, sharedAi, suspendShared, proposals, tasks, events, conversations]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDuo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDuo must be used inside DuoProvider");
  return v;
}
