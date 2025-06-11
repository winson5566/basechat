"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React, { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { createStripeSetupIntent, setStripeDefaultInvoicePaymentMethod } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface Props {
  onPaymentMethodAdded?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  billingUrl: string;
  stripeCustomerId: string;
}

export function PaymentForm({ billingUrl, stripeCustomerId, showCancel, onPaymentMethodAdded, onCancel }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setLoading(true);

    try {
      // Trigger form validation and wallet collection
      const { error: submitError } = await elements.submit();
      if (submitError) {
        return;
      }

      const setupIntent = await createStripeSetupIntent(stripeCustomerId);

      // Confirm the SetupIntent using the details collected by the Payment Element
      const { setupIntent: confirmIntent, error } = await stripe.confirmSetup({
        elements,
        clientSecret: setupIntent.client_secret!,
        redirect: "if_required",
        confirmParams: {
          return_url: `${billingUrl}/payment-method-redirect`,
        },
      });

      if (confirmIntent && confirmIntent.payment_method) {
        const paymentMethod = confirmIntent.payment_method;
        await setStripeDefaultInvoicePaymentMethod(
          stripeCustomerId,
          typeof paymentMethod === "string" ? paymentMethod : paymentMethod.id,
        );
      }

      if (!error) {
        onPaymentMethodAdded?.();
      }
    } catch (err: unknown) {
      toast.error("Error adding card, please try again later");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-[500px]">
      <form onSubmit={handleSubmit} className="flex flex-col w-[500px]">
        <PaymentElement />
        <div
          className={cn("flex items-center mt-4", {
            "justify-between": showCancel,
          })}
        >
          {showCancel && (
            <Button type="button" variant="secondary" className="self-start" onClick={() => onCancel?.()}>
              Cancel
            </Button>
          )}
          <SubmitButton className="self-end" loading={loading} disabled={loading || !stripe}>
            Submit
          </SubmitButton>
        </div>
        {errorMessage && <p className="text-destructive-foreground">{errorMessage}</p>}
      </form>
    </div>
  );
}
