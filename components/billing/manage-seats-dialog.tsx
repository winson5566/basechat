import React, { useState, useEffect } from "react";

import { getSeatChangePreview } from "@/app/(main)/o/[slug]/settings/billing/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SeatChangePreview } from "@/lib/orb-types";

interface ManageSeatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSeats: number;
  userCount: number;
  onSave: (newSeats: number) => void;
  tenantId: string;
}

export function ManageSeatsDialog({
  open,
  onOpenChange,
  currentSeats,
  userCount,
  onSave,
  tenantId,
}: ManageSeatsDialogProps) {
  const [seats, setSeats] = useState(currentSeats || 1);
  const [preview, setPreview] = useState<SeatChangePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPreview(seats);
    }
  }, [open, seats]);

  const fetchPreview = async (nextCount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const previewData = await getSeatChangePreview(tenantId, nextCount);
      if (!previewData) {
        throw new Error("No preview data received");
      }
      setPreview(previewData);
    } catch (error) {
      console.error("Error fetching preview:", error);
      setError(error instanceof Error ? error.message : "Failed to load preview data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrement = () => setSeats((s) => s + 1);
  const handleDecrement = () => setSeats((s) => (s > 1 ? s - 1 : 1));
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setSeats(value);
  };
  const handleSave = () => {
    onSave(seats);
    onOpenChange(false);
  };

  const currentPayment = preview?.currentSeatCharge || 0;
  const immediatePayment = preview?.immediateSeatCharge || 0;
  const upcomingPayment = preview?.upcomingSeatCharge || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Manage Seats</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          {/* Counter */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={handleDecrement} aria-label="Decrease seats">
              -
            </Button>
            <Input type="text" min={1} value={seats} onChange={handleInput} className="w-16 text-center" />
            <Button variant="outline" size="icon" onClick={handleIncrement} aria-label="Increase seats">
              +
            </Button>
          </div>
          <hr />
          {/* Payment Info */}
          {error ? (
            <div className="text-sm text-destructive">An error occurred</div>
          ) : isLoading ? (
            <div className="text-sm text-muted-foreground">Loading preview...</div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>Current Payment</span>
                <span>${currentPayment.toLocaleString()}</span>
              </div>
              {immediatePayment > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Due Today</span>
                  <span>${immediatePayment.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Next Payment</span>
                <span>${upcomingPayment.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="mt-6 flex flex-col gap-2 items-stretch">
          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground text-left w-full">
            By continuing, your credit will be charged the total amount due today and the new payment starting next
            billing cycle, until changed or cancelled.
          </div>
          {/* Button group */}
          <div className="flex flex-row gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={seats === currentSeats || isLoading}>
              {isLoading
                ? "Loading..."
                : seats !== currentSeats
                  ? seats > currentSeats
                    ? `Confirm add ${seats - currentSeats} ${seats - currentSeats === 1 ? "seat" : "seats"}`
                    : `Confirm remove ${currentSeats - seats} ${currentSeats - seats === 1 ? "seat" : "seats"}`
                  : "No change"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
