import { CandidateShell } from "@/components/CandidateShell";
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
  return (
    <CandidateShell
      applicationId={id}
      token={t || ""}
      activePage="training"
    >
      <TrainClient id={id} token={t || ""} />
    </CandidateShell>
  );
}
