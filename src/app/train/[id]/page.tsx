import { TrainClient } from "@/components/TrainClient";
import { Shell } from "@/components/Shell";

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
    <Shell>
      <TrainClient id={id} token={t || ""} />
    </Shell>
  );
}
