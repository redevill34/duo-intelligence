/**
 * Demo remains in memory; explicit opt-in stores an encrypted local snapshot.
 * Client-side access rules remain bypassable, not production authorization.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type {
  MemoryProposal,
  SharedAiStatus,
  Task,
  CalendarEvent,
  Conversation,
} from "@/domain/types";
import { approveReactivation, decideProposal, editProposal, suspendSharedAi } from "@/domain/rules";
import * as F from "@/services/demo/fixtures";
import { LocalVault } from "@/services/local/vault";
import { readBackup } from "@/services/local/crypto";
import type { LocalSnapshot } from "@/domain/schemas";

interface DuoState {
  local: {
    active: boolean;
    busy: boolean;
    error: string;
    saved: boolean;
    dailyAt: string | undefined;
    exportedAt: string | undefined;
    activate: (passphrase: string, create: boolean) => Promise<void>;
    lock: () => Promise<void>;
    exportFile: () => Promise<void>;
    prepareImport: (text: string, passphrase: string) => Promise<LocalSnapshot>;
    restore: (snapshot: LocalSnapshot) => Promise<void>;
    prepareDaily: () => Promise<LocalSnapshot>;
  };
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
  const vault = useRef<LocalVault | null>(null);
  const releaseWriter = useRef<(() => void) | null>(null);
  const [localActive, setLocalActive] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [saved, setSaved] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{
    dailyAt: string | undefined;
    exportedAt: string | undefined;
  }>({ dailyAt: undefined, exportedAt: undefined });
  const snapshot = useMemo<LocalSnapshot>(
    () => ({ sharedAi, proposals, tasks, events, conversations }),
    [sharedAi, proposals, tasks, events, conversations],
  );
  const latest = useRef(snapshot);
  useEffect(() => {
    latest.current = snapshot;
  }, [snapshot]);
  const applySnapshot = useCallback((data: LocalSnapshot) => {
    inflight.current.forEach((c) => c.abort());
    inflight.current.clear();
    const { suspendedAt, suspendedBy, ...ai } = data.sharedAi;
    setSharedAi({
      ...ai,
      ...(suspendedAt ? { suspendedAt } : {}),
      ...(suspendedBy ? { suspendedBy } : {}),
    });
    setProposals(data.proposals);
    setTasksState(
      data.tasks.map(({ dueDate, projectId, ...task }) => ({
        ...task,
        ...(dueDate ? { dueDate } : {}),
        ...(projectId ? { projectId } : {}),
      })),
    );
    setEvents(data.events);
    setConversations(data.conversations);
  }, []);
  useEffect(() => {
    if (!localActive || !vault.current) return;
    let current = true;
    setSaved(false);
    void vault.current
      .save(snapshot)
      .then(async () => {
        const status = await vault.current?.status();
        if (current && status) {
          setSaved(true);
          setBackupStatus(status);
          setLocalError("");
        }
      })
      .catch(() => {
        if (current)
          setLocalError(
            "Échec de l’enregistrement. Gardez cette page ouverte et exportez une sauvegarde.",
          );
      });
    const onReturn = () => {
      if (document.visibilityState === "visible")
        void vault.current
          ?.save(latest.current)
          .then(async () => {
            const status = await vault.current?.status();
            if (current && status) setBackupStatus(status);
          })
          .catch(() => setLocalError("Point quotidien non enregistré."));
    };
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      current = false;
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [localActive, snapshot]);
  useEffect(() => {
    const onUnload = (event: BeforeUnloadEvent) => {
      if (localActive && !saved) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [localActive, saved]);

  const suspendShared = useCallback(() => {
    inflight.current.forEach((c) => c.abort());
    inflight.current.clear();
    setSharedAi((s) => suspendSharedAi(s, F.ME.id));
  }, []);

  const value = useMemo<DuoState>(
    () => ({
      local: {
        active: localActive,
        busy: localBusy,
        error: localError,
        saved,
        ...backupStatus,
        activate: async (passphrase, create) => {
          setLocalBusy(true);
          setLocalError("");
          const service = new LocalVault({ userId: F.ME.id, spaceId: F.SPACE.id });
          try {
            // Hold one writer tab; prevents silent cross-tab last-write-wins loss.
            if (!("locks" in navigator))
              throw new Error(
                "Ce navigateur ne permet pas de verrouiller le coffre entre onglets.",
              );
            const acquired = await new Promise<boolean>((resolve) => {
              void navigator.locks.request(
                "duo-local-writer",
                { ifAvailable: true },
                async (lock) => {
                  if (!lock) {
                    resolve(false);
                    return;
                  }
                  await new Promise<void>((release) => {
                    releaseWriter.current = release;
                    resolve(true);
                  });
                },
              );
            });
            if (!acquired) throw new Error("Le coffre est déjà ouvert dans un autre onglet.");
            if (create) await service.create(passphrase, latest.current);
            else applySnapshot(await service.unlock(passphrase));
            vault.current = service;
            setLocalActive(true);
            void navigator.storage?.persist().catch(() => false);
          } catch (error) {
            releaseWriter.current?.();
            releaseWriter.current = null;
            await service.lock();
            setLocalError(error instanceof Error ? error.message : "Coffre indisponible.");
          } finally {
            setLocalBusy(false);
          }
        },
        lock: async () => {
          setLocalBusy(true);
          await vault.current
            ?.save(latest.current)
            .catch(() => setLocalError("Dernier enregistrement impossible."));
          await vault.current?.lock();
          vault.current = null;
          releaseWriter.current?.();
          releaseWriter.current = null;
          applySnapshot({
            sharedAi: structuredClone(F.SPACE.sharedAiStatus),
            proposals: structuredClone(F.proposals),
            tasks: structuredClone(F.tasks),
            events: structuredClone(F.events),
            conversations: structuredClone(F.conversations),
          });
          setLocalActive(false);
          setLocalBusy(false);
        },
        exportFile: async () => {
          if (!vault.current) throw new Error("Déverrouillez le coffre.");
          const text = await vault.current.export(latest.current);
          const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
          const link = document.createElement("a");
          link.href = url;
          link.download = `duo-${new Date().toISOString().slice(0, 10)}.duo`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          await vault.current.markExported();
          setBackupStatus(await vault.current.status());
        },
        prepareImport: (text, passphrase) =>
          readBackup(text, { userId: F.ME.id, spaceId: F.SPACE.id }, passphrase),
        prepareDaily: async () => {
          if (!vault.current) throw new Error("Coffre verrouillé.");
          return vault.current.dailySnapshot();
        },
        restore: async (data) => {
          if (!vault.current) throw new Error("Déverrouillez le coffre.");
          await vault.current.save(data);
          applySnapshot(data);
          latest.current = data;
        },
      },
      me: F.ME,
      partner: F.PARTNER,
      memberIds,
      sharedAi,
      suspendShared,
      approveReactivationAsMe: () => setSharedAi((s) => approveReactivation(s, F.ME.id, memberIds)),
      simulatePartnerReactivation: () =>
        setSharedAi((s) => approveReactivation(s, F.PARTNER.id, memberIds)),
      registerSharedRequest: (c) => {
        inflight.current.add(c);
        return () => inflight.current.delete(c);
      },
      proposals,
      decide: (id, decision) =>
        setProposals((ps) =>
          ps.map((p) => (p.id === id ? decideProposal(p, F.ME.id, decision) : p)),
        ),
      edit: (id, content) =>
        setProposals((ps) => ps.map((p) => (p.id === id ? editProposal(p, content) : p))),
      propose: (content) =>
        setProposals((ps) => [
          {
            id: `p-${Date.now()}`,
            spaceId: F.SPACE.id,
            proposedBy: F.ME.id,
            content,
            version: 1,
            approvals: [],
            createdAt: new Date().toISOString(),
          },
          ...ps,
        ]),
      tasks,
      setTasks: (fn) => setTasksState(fn),
      events,
      addEvent: (e) => setEvents((es) => [...es, e]),
      conversations,
      addSharedConversation: (title) => {
        const now = new Date().toISOString();
        const c: Conversation = {
          id: `c-${Date.now()}`,
          spaceId: F.SPACE.id,
          title,
          visibility: "shared",
          participantIds: [F.ME.id, F.PARTNER.id],
          createdBy: F.ME.id,
          createdAt: now,
          updatedAt: now,
        };
        setConversations((cs) => [c, ...cs]);
        return c;
      },
    }),
    [
      memberIds,
      sharedAi,
      suspendShared,
      proposals,
      tasks,
      events,
      conversations,
      localActive,
      localBusy,
      localError,
      saved,
      backupStatus,
      applySnapshot,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDuo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDuo must be used inside DuoProvider");
  return v;
}
