"use client";

import { CreditCardIcon } from "lucide-react";
import Image from "next/image";
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

const getCardBrandImage = (brand: string) => {
  const brandMap: Record<string, string> = {
    visa: "/images/card-brands/visa.svg",
    mastercard: "/images/card-brands/mastercard.svg",
    amex: "/images/card-brands/amex.svg",
    discover: "/images/card-brands/discover.svg",
    diners: "/images/card-brands/diners.svg",
    jcb: "/images/card-brands/jcb.svg",
  };
  return brandMap[brand.toLowerCase()] || null;
};

export default function PaymentMethodCard({ card, hasControls, className, billingPath }: Props) {
  if (!card) {
    return (
      <Card className={cn("border-none shadow-none bg-[#F5F5F7] p-6", className)}>
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

  const cardBrandImage = getCardBrandImage(card.brand);

  return (
    <Card className={cn("border-none shadow-none bg-[#F5F5F7] py-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {cardBrandImage ? (
            <Image src={cardBrandImage} alt={card.brand} width={78} height={55} />
          ) : (
            <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="font-medium text-base flex items-center pb-2">•••• •••• •••• {card.last4}</div>
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
