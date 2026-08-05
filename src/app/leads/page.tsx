import { LeadForm } from "@/components/LeadForm";
import { Shell } from "@/components/Shell";

export const metadata = {
  title: "Request a demo",
  description:
    "Get AI Front Desk for your local business. Matched to a closer by area code.",
};

export default function LeadsPage() {
  return (
    <Shell bare>
      <LeadForm />
    </Shell>
  );
}
