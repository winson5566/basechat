"use client";

import { useState } from "react";

import { useGlobalState } from "@/app/(main)/context";
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
    <div className="flex h-full w-full">
      <Chatbot conversationId={id} initialMessage={initialMessage} onSelectedDocumentId={handleSelectedDocumentId} />
      {document && (
        <Summary
          className="h-full min-w-[400px] w-[400px] rounded-[24px] p-8 bg-[#F5F5F7] overflow-scroll"
          document={document}
          onCloseClick={() => {
            setDocument(null);
          }}
        />
      )}
    </div>
  );
}
