import Image from "next/image";
import Markdown from "react-markdown";

import CONNECTOR_MAP from "@/lib/connector-map";
import { cn } from "@/lib/utils";
import CloseIcon from "@/public/icons/close.svg";
import ExternalLinkIcon from "@/public/icons/external-link.svg";

import { DocumentResponse } from "./types";

interface Props {
  className?: string;
  document: DocumentResponse;
  onCloseClick: () => void;
}

export default function Summary({ className, document, onCloseClick = () => {} }: Props) {
  const icon =
    document?.metadata.source_type && CONNECTOR_MAP[document.metadata.source_type]
      ? CONNECTOR_MAP[document.metadata.source_type][1]
      : null;

  return (
    <div className={cn(className, "relative")}>
      <div className="absolute top-4 right-4">
        <Image className="cursor-pointer" src={CloseIcon} alt="Close" onClick={onCloseClick} />
      </div>
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
  );
}
