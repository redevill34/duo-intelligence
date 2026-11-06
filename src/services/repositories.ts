/**
 * Repository contracts. UI depends on these interfaces, never on a concrete
 * backend. V1 ships only an in-memory demo implementation. A future backend
 * implementation must rely on server-side authorization (RLS); these
 * interfaces carry no security guarantee by themselves.
 */
import type {
  CalendarEvent, Conversation, CoupleSpace, Memory, MemoryProposal, Message, Project, Task, User, AuditEvent,
} from "@/domain/types";

export interface AuthService {
  readonly mode: "prototype" | "backend";
  currentUser(): Promise<User | null>;
  signOut(): Promise<void>;
}

export interface SpaceRepository {
  getMySpace(): Promise<CoupleSpace>;
  getPartner(): Promise<User>;
  listActivity(): Promise<AuditEvent[]>;
}

export interface ConversationRepository {
  listMine(): Promise<Conversation[]>;
  listMessages(conversationId: string): Promise<Message[]>;
  createShared(title: string): Promise<Conversation>;
}

export interface MemoryRepository {
  listMyPrivate(): Promise<Memory[]>;
  listShared(): Promise<Memory[]>;
  listProposals(): Promise<MemoryProposal[]>;
}

export interface PlanningRepository {
  listTasks(): Promise<Task[]>;
  listProjects(): Promise<Project[]>;
  listEvents(): Promise<CalendarEvent[]>;
}

export interface Repositories {
  auth: AuthService;
  space: SpaceRepository;
  conversations: ConversationRepository;
  memory: MemoryRepository;
  planning: PlanningRepository;
}
