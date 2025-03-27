"use client";

import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function HelpWelcomeMessageDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <CircleHelp className="text-surface-text-secondary cursor-pointer" width={20} height={20} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome Message</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-surface-text-tertiary text-s">
          <p>The Welcome Message is displayed when creating a new conversation.</p>
          <h3 className="font-bold">Variables</h3>
          <p>The Welcome Message can access the company&apos;s name. Here is an example</p>

          <div className="font-mono max-w-[400px] mt-4">
            <p className="mb-2">{`Hello, I'm {{ company.name }}'s AI. What would you like to know?`}</p>
          </div>

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
