import { CandidateShell } from "@/components/CandidateShell";
import { CertificationPanel } from "@/components/CertificationPanel";
import { SalesCoachClient } from "@/components/SalesCoachClient";
import { TrainClient } from "@/components/TrainClient";

export default async function TrainPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const token = t || "";
  return (
    <CandidateShell applicationId={id} token={token} activePage="training">
      <div className="space-y-6">
        <CertificationPanel id={id} token={token} />
        <TrainClient id={id} token={token} />
        <SalesCoachClient id={id} token={token} />
      </div>
    </CandidateShell>
  );
}
