import { PortalClient } from "@/components/PortalClient";
import { Shell } from "@/components/Shell";

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
    <Shell>
      <PortalClient id={id} token={t || ""} />
    </Shell>
  );
}
