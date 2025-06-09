"use client";

import { MoreHorizontal } from "lucide-react";
import Stripe from "stripe";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { DropdownMenuContent, DropdownMenu, DropdownMenuTrigger, DropdownMenuItem } from "../ui/dropdown-menu";

import { CreditCardInfo } from "./credit-card-info";

interface Props {
  paymentMethods: Stripe.PaymentMethod[];
  handleSetDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  className?: string;
}

export function PaymentMethodsList({ paymentMethods, handleSetDefaultPaymentMethod, className }: Props) {
  return (
    <div className={cn("w-full", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold text-[13px] text-[#74747A] pl-0">Card</TableHead>
            <TableHead className="font-semibold text-[13px] text-[#74747A]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentMethods.map((cardPaymentMethod) => (
            <TableRow key={cardPaymentMethod.id}>
              <TableCell className="pl-0">
                <CreditCardInfo card={cardPaymentMethod.card!} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button>
                      <MoreHorizontal />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSetDefaultPaymentMethod(cardPaymentMethod.id)}>
                      <Button variant="ghost">Make active</Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
