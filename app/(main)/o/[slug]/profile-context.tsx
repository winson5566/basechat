"use client";

import React, { createContext, useContext, ReactNode } from "react";

import { Profile } from "@/lib/api";

interface ProfileContextType {
  profile: Profile | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children, profile }: { children: ReactNode; profile: Profile }) {
  return <ProfileContext.Provider value={{ profile }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
