import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApplyForm } from "@/components/ApplyForm";
import { Shell } from "@/components/Shell";
import { getRole } from "@/lib/roles";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  return (
    <Shell>
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        }
      >
        <ApplyForm role={role} />
      </Suspense>
    </Shell>
  );
}
