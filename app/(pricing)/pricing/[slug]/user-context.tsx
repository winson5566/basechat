"use client";

import { createContext, useContext } from "react";

interface UserContextType {
  email: string;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children, email }: { children: React.ReactNode; email: string }) {
  return <UserContext.Provider value={{ email }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
