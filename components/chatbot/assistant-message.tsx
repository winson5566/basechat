import Image from "next/image";

import CONNECTOR_MAP from "@/lib/connector-map";

import { SourceMetadata } from "./types";

const MAX_CITATION_LENGTH = 30;

const Citation = ({ source, onClick = () => {} }: { source: SourceMetadata; onClick?: () => void }) => {
  const connector = CONNECTOR_MAP[source.source_type];

  const formatSourceName = (input: string) => {
    if (input.length <= MAX_CITATION_LENGTH) return input;
    return "..." + input.slice(-1 * MAX_CITATION_LENGTH);
  };

  return (
    <button className="rounded-[20px] flex items-center border px-3 py-1.5 mr-3 mb-3" onClick={onClick}>
      {connector && <Image src={connector[1]} alt={connector[0]} className="mr-1" />}
      {formatSourceName(source.documentName)}
    </button>
  );
};

interface Props {
  content: string | undefined;
  id?: string | null;
  sources: SourceMetadata[];
  onSelectedDocumentId: (id: string) => void;
}

export default function AssistantMessage({ content, sources, onSelectedDocumentId }: Props) {
  const dedupe = sources.reduce<Record<string, SourceMetadata>>((acc, v) => {
    acc[v.documentId] = v;
    return acc;
  }, {});

  const dedupedSources = Object.values(dedupe);

  return (
    <div className="flex">
      <div>
        <div className="h-[40px] w-[40px] bg-gray-700 rounded-[50px] text-white flex items-center justify-center font-bold text-[13px] mb-8">
          FS
        </div>
      </div>
      <div className="self-start mb-6 rounded-md pt-2 ml-7">
        {content}
        <div className="flex flex-wrap mt-4">
          {dedupedSources.map((source, i) => (
            <Citation key={i} source={source} onClick={() => onSelectedDocumentId(source.documentId)} />
          ))}
        </div>
      </div>
    </div>
  );
}
