import { describe, expect, it } from "vitest";
import { approveReactivation, canAddMember, decideProposal, editProposal, proposalStatus, suspendSharedAi } from "@/domain/rules";
import type { MemoryProposal } from "@/domain/types";
import { simulateReply } from "@/services/ai/simulatedAssistant";

const A = "a", B = "b";
const base: MemoryProposal = { id: "p", spaceId: "s", proposedBy: A, content: "x", version: 1, approvals: [], createdAt: "" };

describe("règles DUO (prototype, non sécuritaire)", () => {
  it("limite l'espace à deux membres", () => {
    expect(canAddMember([A])).toBe(true);
    expect(canAddMember([A, B])).toBe(false);
  });
  it("mémoire commune confirmée seulement si les deux approuvent la même version", () => {
    let p = decideProposal(base, A, "approved");
    expect(proposalStatus(p, A, B)).toBe("approved_by_me");
    p = editProposal(p, "y");
    p = decideProposal(p, B, "approved");
    expect(proposalStatus(p, A, B)).toBe("awaiting_other");
    p = decideProposal(p, A, "approved");
    expect(proposalStatus(p, A, B)).toBe("confirmed");
  });
  it("un refus rend la proposition refusée", () => {
    expect(proposalStatus(decideProposal(base, B, "refused"), A, B)).toBe("refused");
  });
  it("réactivation de l'IA commune exige les deux accords", () => {
    let s = suspendSharedAi({ suspended: false, reactivationApprovals: [] }, A);
    s = approveReactivation(s, A, [A, B]);
    expect(s.suspended).toBe(true);
    s = approveReactivation(s, B, [A, B]);
    expect(s.suspended).toBe(false);
  });
  it("une requête annulée est rejetée", async () => {
    const c = new AbortController();
    const p = simulateReply("ideas", c.signal, 50);
    c.abort();
    await expect(p).rejects.toThrow();
  });
});
