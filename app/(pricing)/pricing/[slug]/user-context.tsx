"use client";

import { InferSelectModel } from "drizzle-orm";
import { createContext, useContext } from "react";

import { users } from "@/lib/server/db/schema";

type User = InferSelectModel<typeof users>;

interface UserContextType {
  user: User;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children, user }: { children: React.ReactNode; user: User }) {
  return <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
