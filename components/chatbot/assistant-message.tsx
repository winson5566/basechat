import Image from "next/image";

import CONNECTOR_MAP from "@/lib/connector-map";

import { SourceMetadata } from "./types";

const Citation = ({ source }: { source: SourceMetadata }) => {
  const connector = CONNECTOR_MAP[source.source_type];
  const formatSourceName = (input: string) => {
    if (input.length <= 15) return input;
    return "..." + input.slice(-15);
  };

  return (
    <button className="rounded-[20px] flex items-center border px-3 py-1.5 mr-3 mb-3">
      {connector && <Image src={connector[1]} alt={connector[0]} className="mr-1" />}
      {formatSourceName(source.file_path)}
    </button>
  );
};

interface Props {
  content: string | undefined;
  id?: string | null;
  sources: SourceMetadata[];
}

export default function AssistantMessage({ content, sources }: Props) {
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
          {sources.map((source, i) => (
            <Citation key={i} source={source} />
          ))}
        </div>
      </div>
    </div>
  );
}
