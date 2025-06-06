"use client";

import { CreditCardIcon } from "lucide-react";
import Link from "next/link";
import Stripe from "stripe";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  card: Stripe.PaymentMethod.Card | null;
  hasControls?: boolean;
  className?: string;
  billingPath: string;
}

export default function PaymentMethodCard({ card, hasControls, className, billingPath }: Props) {
  if (!card) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">No payment method</span>
          </div>
          {hasControls && (
            <Link href={`${billingPath}/payment-method`}>
              <Button variant="outline" asChild>
                Add payment method
              </Button>
            </Link>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} ending in {card.last4}
            </div>
            <div className="text-sm text-muted-foreground">
              Expires {card.exp_month.toString().padStart(2, "0")}/{card.exp_year}
            </div>
          </div>
        </div>
        {hasControls && (
          <Link href={`${billingPath}/payment-method`}>
            <Button variant="outline" asChild>
              Update payment method
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
