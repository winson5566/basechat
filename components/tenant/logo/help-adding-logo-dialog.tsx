"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Props {
  trigger: React.ReactNode;
}

export function HelpAddingLogoDialog({ trigger }: Props) {
  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[900px]">
        <div className="flex gap-12 items-center">
          <Image
            src="/images/ragie-embedded-demo.png"
            alt="Demo showing tenant logo in embedded connector flow"
            width={370}
            height={400}
          />
          <div className="flex flex-col gap-4 text-surface-text-tertiary text-s">
            <div className="text-surface-text-primary text-xl">Adding your logo</div>
            <p>
              When users connect their data in your application, they&apos;ll encounter an informational screen
              explaining that Ragie is used to connect their data.{" "}
            </p>
            <p>We recommend adding your logo for a more branded experience, enhancing trust with your users.</p>
            <DialogClose asChild>
              <Button type="button" className="self-start">
                Got it
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
