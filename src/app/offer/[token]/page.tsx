import { OfferClient } from "@/components/OfferClient";
import { Shell } from "@/components/Shell";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Shell>
      <OfferClient token={token} />
    </Shell>
  );
}
