/**
 * Side effects when a closer hits production_ready:
 * 1) Enforce certification gate
 * 2) Provision Hearthline OS seat
 * 3) Sync production-ready state to the canonical Hearthline spine
 * 4) Activate area-code territory so qualified leads can route
 */

import { certificationCheck } from "./certification";
import { provisionToHearthlineOs } from "./hearthline-os";
import { syncApplicantToSpine } from "./spine-sync";
import { activateCloserTerritory } from "./platform-store";
import type { InterviewRecord } from "./types";

export async function runProductionReadyEffects(
  root: InterviewRecord,
  opts?: { trigger?: string; reassignLeads?: boolean },
): Promise<{
  hearthlineProvision: Awaited<ReturnType<typeof provisionToHearthlineOs>>;
  territory: Awaited<ReturnType<typeof activateCloserTerritory>> | null;
  territoryError?: string;
}> {
  if (!certificationCheck(root).certified) {
    throw new Error("Certification is required before live lead activation.");
  }

  const rootId = root.rootId || root.id;
  const hearthlineProvision = await provisionToHearthlineOs(root, {
    reassignLeads: opts?.reassignLeads,
    trigger: opts?.trigger,
  });

  try {
    await syncApplicantToSpine({
      ...root,
      pipelineStatus: "production_ready",
    });
  } catch (e) {
    console.error("[closer-ready] spine sync", e);
  }

  let territory: Awaited<ReturnType<typeof activateCloserTerritory>> | null = null;
  let territoryError: string | undefined;
  try {
    territory = await activateCloserTerritory({
      closerId: rootId,
      closerName: `${root.candidate.firstName} ${root.candidate.lastName}`.trim(),
      email: root.candidate.email,
      phone: root.candidate.phone,
      roleSlug: root.roleSlug,
    });
  } catch (e) {
    territoryError = e instanceof Error ? e.message : "territory activate failed";
    console.error("[closer-ready] territory", territoryError);
  }

  return { hearthlineProvision, territory, territoryError };
}
