"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

import { Skeleton } from "../ui/skeleton";

interface Props {
  stripePublishableKey: string;
  children: React.ReactNode;
  loadingElement?: React.ReactNode;
}

export function StripeElementsWrapper({ stripePublishableKey, loadingElement, children }: Props) {
  const [stripePromise, setStripePromise] = useState<Stripe | null>(null);

  useEffect(() => {
    const call = async () => {
      const stripe = await loadStripe(stripePublishableKey);
      setStripePromise(stripe);
    };

    call();
  }, [stripePublishableKey]);

  if (!stripePromise && loadingElement) {
    return loadingElement;
  } else if (!stripePromise) {
    return <Skeleton className="h-[200px] w-[400px] rounded" />;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "setup",
        currency: "usd",
        payment_method_types: ["card"],
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#D946EF",
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}
