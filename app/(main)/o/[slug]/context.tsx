"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

import { LLMModel, DEFAULT_MODEL } from "@/lib/llm/types";

interface GlobalState {
  initialMessage: string;
  setInitialMessage: (content: string) => void;
  initialModel: LLMModel;
  setInitialModel: (model: LLMModel) => void;
  refreshTrigger: number;
  setRefreshTrigger: (value: number) => void;
}

const GlobalStateContext = createContext<GlobalState | null>(null);

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [initialMessage, setInitialMessage] = useState("");
  const [initialModel, setInitialModel] = useState<LLMModel>(DEFAULT_MODEL);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <GlobalStateContext.Provider
      value={{
        initialMessage,
        setInitialMessage,
        initialModel,
        setInitialModel,
        refreshTrigger,
        setRefreshTrigger,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
}
