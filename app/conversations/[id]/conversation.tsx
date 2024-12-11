"use client";

import { useState } from "react";

import { useGlobalState } from "@/app/context";
import Chatbot from "@/components/chatbot";

import Summary from "./summary";
import { DocumentResponse } from "./types";

interface Props {
  id: string;
}

export default function Conversation({ id }: Props) {
  const [document, setDocument] = useState<DocumentResponse | null>(null);
  const { initialMessage } = useGlobalState();

  const handleSelectedDocumentId = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) throw new Error("could not retrieve summary");

    const json = (await res.json()) as DocumentResponse;
    setDocument(json);
  };

  return (
    <div className="flex-grow flex w-full">
      <div className="flex-grow w-full flex flex-col items-center justify-center">
        <Chatbot conversationId={id} initialMessage={initialMessage} onSelectedDocumentId={handleSelectedDocumentId} />
      </div>
      {document && (
        <Summary
          document={document}
          onCloseClick={() => {
            setDocument(null);
          }}
        />
      )}
    </div>
  );
}
