"use client";

import Image from "next/image";
import { useState } from "react";
import Markdown from "react-markdown";

import Chatbot from "@/components/chatbot";
import CONNECTOR_MAP from "@/lib/connector-map";
import ExternalLinkIcon from "@/public/icons/external-link.svg";

interface Props {
  company: string;
}

interface DocumentResponse {
  name: string;
  metadata: {
    source_type: string;
    source_url: string;
  };
  summary: string;
}

export default function ChatView({ company }: Props) {
  const [document, setDocument] = useState<DocumentResponse | null>(null);

  const handleSelectedDocumentId = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) throw new Error("could not retrieve summary");

    const json = (await res.json()) as DocumentResponse;
    setDocument(json);
  };

  const icon =
    document?.metadata.source_type && CONNECTOR_MAP[document.metadata.source_type]
      ? CONNECTOR_MAP[document.metadata.source_type][1]
      : null;

  return (
    <div className="flex-grow flex">
      <div className="flex-grow w-full flex flex-col items-center justify-center">
        <Chatbot company={company} onSelectedDocumentId={handleSelectedDocumentId} />
      </div>
      {document && (
        <div className="max-h-[800px] min-w-[400px] w-[400px] rounded-[24px] p-8 bg-[#F5F5F7] overflow-scroll">
          {icon && <Image src={icon} alt="test" width={48} />}
          <div className="wrap text-[24px] font-bold mb-4 break-all">{document.name}</div>
          <div className="flex justify-between mb-6">
            <div className="text-[#74747A]">Updated 11/12/2024</div>
            <a href={document.metadata.source_url} target="_blank" className="text-[#7749F8] flex">
              View in source
              <Image src={ExternalLinkIcon} alt="Open in new window" />
            </a>
          </div>
          <hr className="mb-6" />
          <div className="text-[12px] font-bold mb-4">Summary</div>
          <Markdown className="markdown">{document.summary}</Markdown>
        </div>
      )}
    </div>
  );
}
