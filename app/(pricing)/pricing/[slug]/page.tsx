import { redirect } from "next/navigation";

import { getPricingPlansPath } from "@/lib/paths";

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(getPricingPlansPath(slug));
}
