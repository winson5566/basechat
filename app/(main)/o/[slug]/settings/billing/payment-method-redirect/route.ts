import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getBillingSettingsPath, getTenantPath } from "@/lib/paths";
import { adminOrRedirect } from "@/lib/server/utils";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const { tenant } = await adminOrRedirect(slug);

  const metadata = tenant.metadata;
  if (!metadata || !metadata.stripeCustomerId) {
    console.warn("Stripe customer ID not found in metadata");
    return redirect(getTenantPath(slug));
  }
  // Get tenant from session and check metadata, it must have stripeCustomerId
  redirect(getBillingSettingsPath(slug));
};
