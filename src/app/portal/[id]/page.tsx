import { CandidateShell } from "@/components/CandidateShell";
import { PortalClient } from "@/components/PortalClient";

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  return (
    <CandidateShell
      applicationId={id}
      token={t || ""}
      activePage="setup"
    >
      <PortalClient id={id} token={t || ""} />
    </CandidateShell>
  );
}
