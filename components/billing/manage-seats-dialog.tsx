import { Loader2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

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
  onSave: (newSeats: number) => void;
  tenantId: string;
}

export function ManageSeatsDialog({ open, onOpenChange, currentSeats, onSave, tenantId }: ManageSeatsDialogProps) {
  const [seats, setSeats] = useState(currentSeats || 1);
  const [debouncedSeats, setDebouncedSeats] = useState(currentSeats || 1);
  const [preview, setPreview] = useState<SeatChangePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(
    async (nextCount: number) => {
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
    },
    [tenantId, setPreview, setIsLoading, setError],
  );

  // Debounce the seats value
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDebouncedSeats(seats);
    }, 1500);

    return () => clearTimeout(timer);
  }, [seats]);

  // Fetch preview when debounced value changes
  useEffect(() => {
    if (open) {
      fetchPreview(debouncedSeats);
    }
  }, [open, debouncedSeats, fetchPreview]);

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
  const upcomingPayment = preview?.upcomingSeatCharge || currentPayment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add or remove open seats</DialogTitle>
        </DialogHeader>

        {/* Seat Counter Section */}
        <div className="flex items-center justify-between py-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleDecrement} aria-label="Decrease seats">
              -
            </Button>
            <Input type="text" min={1} value={seats} onChange={handleInput} className="w-16 text-center" />
            <Button variant="outline" size="icon" onClick={handleIncrement} aria-label="Increase seats">
              +
            </Button>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Seats</div>
            <div className="text-2xl font-semibold">{seats}</div>
          </div>
        </div>

        {/* Payment Information Sections */}
        {error ? (
          <div className="text-sm text-destructive py-4">An error occurred</div>
        ) : (
          <div className="relative space-y-6 py-4">
            {/* Current Payment Section */}
            <div className="space-y-2 border-b">
              <h3 className="text-sm font-medium">Current Payment</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly recurring</span>
                <span className="text-lg font-medium">
                  ${currentPayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Next Payment Section */}
            <div className="space-y-2 border-b">
              <h3 className="text-sm font-medium">Next Payment</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Starting next billing cycle</span>
                <span className="text-lg font-medium">
                  ${upcomingPayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Immediate Payment Section */}
            {immediatePayment > 0 && (
              <div className="space-y-2 border-b">
                <h3 className="text-sm font-medium">Due Today</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">One-time charge</span>
                  <span className="text-lg font-medium text-primary">
                    ${immediatePayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Footer Section */}
        <DialogFooter className="mt-6">
          <div className="w-full">
            <div className="text-xs text-muted-foreground text-left w-full mb-3">
              By continuing, your credit will be charged the total amount due today and the new payment starting next
              billing cycle, until changed or cancelled.
            </div>
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
