/**
 * Repository contracts. UI depends on these interfaces, never on a concrete
 * backend. V1 ships only an in-memory demo implementation. A future backend
 * implementation must rely on server-side authorization (RLS); these
 * interfaces carry no security guarantee by themselves.
 */
import type {
  CalendarEvent,
  Conversation,
  CoupleSpace,
  Memory,
  MemoryProposal,
  Message,
  Project,
  Task,
  User,
  AuditEvent,
  ShoppingItem,
  Reminder,
  AppNotification,
  Vehicle,
  VehicleMaintenance,
  HomeItem,
  HomeMaintenance,
  DocumentMeta,
  TrashEntry,
  Device,
  Backup,
  DashboardLayout,
} from "@/domain/types";
import type { z } from "zod";
import type * as S from "@/domain/schemas";

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

/* ---- Lot 1 : contrats complémentaires (optionnels tant que non implémentés) ---- */
export interface CrudRepository<T, Input> {
  list(): Promise<T[]>;
  create(input: Input): Promise<T>;
  update(id: string, patch: Partial<Input>): Promise<T>;
  /** Suppression = mise en corbeille (180 jours), jamais définitive directement. */
  remove(id: string): Promise<void>;
}

export interface HouseholdRepositories {
  shopping: CrudRepository<ShoppingItem, z.infer<typeof S.shoppingItemInput>>;
  reminders: CrudRepository<Reminder, z.infer<typeof S.reminderInput>>;
  vehicles: CrudRepository<Vehicle, z.infer<typeof S.vehicleInput>> & {
    listMaintenance(vehicleId: string): Promise<VehicleMaintenance[]>;
    addMaintenance(
      vehicleId: string,
      input: z.infer<typeof S.vehicleMaintenanceInput>,
    ): Promise<VehicleMaintenance>;
  };
  home: {
    listItems(): Promise<HomeItem[]>;
    listMaintenance(homeItemId: string): Promise<HomeMaintenance[]>;
    addMaintenance(
      homeItemId: string,
      input: z.infer<typeof S.homeMaintenanceInput>,
    ): Promise<HomeMaintenance>;
  };
  documents: CrudRepository<DocumentMeta, z.infer<typeof S.documentMetaInput>>;
}

export interface SystemRepositories {
  notifications: { listMine(): Promise<AppNotification[]>; markRead(id: string): Promise<void> };
  trash: {
    listMine(): Promise<TrashEntry[]>;
    restore(id: string): Promise<void>;
    purgeExpired(now?: Date): Promise<number>;
  };
  devices: {
    listMine(): Promise<Device[]>;
    register(input: z.infer<typeof S.deviceInput>): Promise<Device>;
    revoke(id: string): Promise<void>;
  };
  backups: {
    listMine(): Promise<Backup[]>;
    createLocal(): Promise<Backup>;
    restore(id: string): Promise<void>;
  };
  dashboard: {
    getMine(): Promise<DashboardLayout>;
    saveMine(input: z.infer<typeof S.dashboardLayoutInput>): Promise<DashboardLayout>;
  };
}

export interface Repositories {
  auth: AuthService;
  space: SpaceRepository;
  conversations: ConversationRepository;
  memory: MemoryRepository;
  planning: PlanningRepository;
  household?: HouseholdRepositories;
  system?: SystemRepositories;
}
