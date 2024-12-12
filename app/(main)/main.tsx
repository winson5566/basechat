"use client";

import { ReactNode, useState } from "react";

import Footer, { AppLocation } from "./footer";
import Header from "./header";

interface Props {
  appLocation: AppLocation;
  name?: string | null;
  children?: ReactNode;
}

export default function Main({ appLocation, name, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-full w-full flex flex-col items-center bg-white">
      <Header name={name} onNavClick={() => setOpen(!open)} />
      <div className="h-full w-full flex-1 flex justify-center overflow-auto">
        <div className="h-full w-full flex flex-col items-center justify-center min-w-[500px]">{children}</div>
      </div>
      <Footer
        appLocation={appLocation}
        className="h-[80px] shrink-0 w-full bg-[#27272A] flex items-center justify-center"
      />
    </div>
  );
}
