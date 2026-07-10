import { DoneView } from "@/components/DoneView";
import { Shell } from "@/components/Shell";

export default async function DonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell>
      <DoneView interviewId={id} />
    </Shell>
  );
}
