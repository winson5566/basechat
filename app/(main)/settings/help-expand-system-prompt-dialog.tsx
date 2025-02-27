"use client";

import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function HelpExpandSystemPromptDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <CircleHelp className="text-surface-text-secondary cursor-pointer" width={20} height={20} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Expand System Prompt</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-surface-text-tertiary text-s">
          <p>
            The Expand System Prompt is sent to the LLM when the user hits the &quot;Tell me more&quot; button. You can
            use it to customize how the LLM responds when this button is pressed.
          </p>
          <DialogClose asChild>
            <Button type="button" className="self-start">
              Got it
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
