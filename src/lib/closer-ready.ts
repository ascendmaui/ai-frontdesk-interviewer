/**
 * Side effects when a closer hits production_ready:
 * 1) Provision Hearthline OS seat
 * 2) Activate area-code territory so marketing leads can route
 */

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
  const rootId = root.rootId || root.id;
  const hearthlineProvision = await provisionToHearthlineOs(root, {
    reassignLeads: opts?.reassignLeads,
    trigger: opts?.trigger,
  });

  // Ensure production_ready always hits spine even if a store hook was missed
  try {
    await syncApplicantToSpine({
      ...root,
      pipelineStatus: "production_ready",
    });
  } catch (e) {
    console.error("[closer-ready] spine sync", e);
  }

  let territory: Awaited<ReturnType<typeof activateCloserTerritory>> | null =
    null;
  let territoryError: string | undefined;
  try {
    territory = await activateCloserTerritory({
      closerId: rootId,
      closerName:
        `${root.candidate.firstName} ${root.candidate.lastName}`.trim(),
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
