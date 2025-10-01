import { format } from "date-fns";
import Image from "next/image";

import CONNECTOR_MAP from "@/lib/connector-map";
import ExternalLinkIcon from "@/public/icons/external-link.svg";

import { DocumentDisplayData } from "../shared-types";

interface DocumentHeaderProps {
  documentData: DocumentDisplayData;
  downloadUrl?: string;
  mediaType?: string | null;
  slug: string;
}

export default function DocumentHeader({ documentData, downloadUrl, mediaType, slug }: DocumentHeaderProps) {
  const icon =
    documentData.metadata.source_type && CONNECTOR_MAP[documentData.metadata.source_type]
      ? CONNECTOR_MAP[documentData.metadata.source_type][1]
      : null;

  return (
    <>
      {icon && <Image src={icon} alt="source" width={48} />}
      <div className="wrap text-[24px] font-bold mb-4 break-all">{documentData.name}</div>
      <div className="flex justify-between mb-6">
        <div className="text-[#74747A]">Updated {format(documentData.updatedAt, "MM/dd/yyyy")}</div>
        {documentData.sourceUrl && (
          <a href={documentData.sourceUrl} target="_blank" className="text-[#7749F8] flex">
            View in source
            <Image src={ExternalLinkIcon} alt="Open in new window" />
          </a>
        )}
        {downloadUrl && (
          <a href={downloadUrl} download target="_blank" className="text-[#7749F8] flex items-center">
            Download {mediaType}
            <Image src={ExternalLinkIcon} alt="Download" className="ml-1" />
          </a>
        )}
      </div>
      <hr className="mb-6" />
    </>
  );
}
