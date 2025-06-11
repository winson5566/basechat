import assert from "assert";

import { compareDesc, format } from "date-fns";
import { FileText } from "lucide-react";
import Orb from "orb-billing";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORB_API_KEY } from "@/lib/server/settings";
import { requireAdminContext } from "@/lib/server/utils";

export default async function InvoicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const orb = new Orb({ apiKey: ORB_API_KEY });
  const { tenant } = await requireAdminContext(p.slug);

  const tenantId = tenant.id;
  const metadata = tenant.metadata;
  if (!metadata) {
    throw new Error("Tenant metadata not found");
  }
  const { stripeCustomerId, orbCustomerId } = metadata;
  assert(typeof tenantId === "string", "Tenant ID not found");
  assert(typeof stripeCustomerId === "string", "Stripe customer ID not found");
  assert(typeof orbCustomerId === "string", "Orb customer ID not found");
  const invoiceRes = await orb.invoices.list({
    external_customer_id: tenantId,
    status: ["draft", "issued", "paid", "synced"],
    limit: 100,
  });

  const invoices = invoiceRes.data.sort(sortInvoicesByDueThenCreated).filter((i) => parseFloat(i.total) > 0);

  return (
    <div className="w-full p-4 flex-grow flex flex-col">
      <div className="flex w-full justify-between items-center pt-2">
        <h1 className="font-bold text-[32px] text-[#343A40]">Payment History</h1>
      </div>
      <div className="mt-16">
        <div className="text-[#74747A] mb-1.5">
          {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
        </div>
        <div className="max-h-[calc(100vh-365px)] overflow-y-auto">
          {invoices.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No billing history yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-[13px] text-[#74747A] pl-0">Date</TableHead>
                  <TableHead className="font-semibold text-[13px] text-[#74747A]">Cost</TableHead>
                  <TableHead className="font-semibold text-[13px] text-[#74747A]">Status</TableHead>
                  <TableHead className="font-semibold text-[13px] text-[#74747A]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="pl-0">{i.due_date && format(i.due_date, "M/d/yy")}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(parseFloat(i.amount_due))}
                    </TableCell>
                    <TableCell className="capitalize">{i.status}</TableCell>
                    <TableCell className="text-right">
                      {i.hosted_invoice_url && (
                        <Button title="View invoice" variant="outline" size="icon" asChild>
                          <a href={i.hosted_invoice_url} target="_blank" rel="noreferrer">
                            <FileText />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

// Sort invoices first by due date.
// Otherwise, by most recently created_at
function sortInvoicesByDueThenCreated(a: Orb.Invoice, b: Orb.Invoice) {
  if (a.due_date && !b.due_date) {
    return -1;
  }

  if (!a.due_date && b.due_date) {
    return 1;
  }

  if (a.due_date && b.due_date) {
    return compareDesc(a.due_date, b.due_date);
  }

  return compareDesc(a.created_at, b.created_at);
}
