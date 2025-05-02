"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CONNECTOR_MAP from "@/lib/connector-map";
import { getStatusDisplayName } from "@/lib/utils";

import ManageFileMenu from "./manage-file-menu";

interface Props {
  tenant: {
    id: string;
    slug: string;
  };
  initialFiles: any[];
}

export default function FilesTable({ tenant, initialFiles }: Props) {
  const [files, setFiles] = useState(initialFiles);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkFilesStatus = async () => {
      try {
        const response = await fetch("/api/tenants/current/documents", {
          headers: { tenant: tenant.slug },
        });
        const data = await response.json();

        if (data.documents) {
          setFiles(data.documents);

          // Check if any files are still processing
          const hasProcessingFiles = data.documents.some(
            (file: any) => file.status !== "ready" && file.status !== "failed",
          );

          // If no more processing files, clear the interval
          if (!hasProcessingFiles && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    // Initial check for processing files
    const hasProcessingFiles = initialFiles.some((file) => file.status !== "ready" && file.status !== "failed");

    // Set up polling if needed
    if (hasProcessingFiles) {
      intervalRef.current = setInterval(checkFilesStatus, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initialFiles, tenant.slug]);

  const uploadedFiles = files.filter((file) => Object.keys(file.metadata || {}).length === 0);
  const connectorFiles = files.filter((file) => Object.keys(file.metadata || {}).length > 0);
  console.log(connectorFiles);

  return (
    <div className="flex-grow w-full flex flex-col items-center mt-10">
      <div className="w-full mb-8">
        <div className="text-[14px] font-[500] text-[#1D1D1F] mb-4 pl-1">
          {files.length} {files.length === 1 ? "file" : "files"}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[600px]">Name</TableHead>
              <TableHead className="w-[200px]">Connection</TableHead>
              <TableHead className="w-[200px]">Added by</TableHead>
              <TableHead className="w-[200px]">Date added</TableHead>
              <TableHead className="w-[200px]">Date modified</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium flex items-center">
                  <div>{file.name}</div>
                </TableCell>
                <TableCell>
                  {file.metadata.source_type ? (
                    <div className="flex items-center gap-2">
                      <Image
                        src={CONNECTOR_MAP[file.metadata.source_type][1]}
                        alt={CONNECTOR_MAP[file.metadata.source_type][0]}
                        className="mr-1"
                      />
                      {CONNECTOR_MAP[file.metadata.source_type][0]}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {file.status !== "ready" && file.status !== "failed" && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#006EDB]" />
                    )}
                    {getStatusDisplayName(file.status)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <ManageFileMenu id={file.id} tenant={tenant} isConnectorFile={!!file.metadata?.source_type} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* <div className="w-full">
        <h2 className="text-lg font-semibold mb-4">Connector Files</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[600px]">Name</TableHead>
              <TableHead className="w-[200px]">Date added</TableHead>
              <TableHead className="w-[200px]">Last synced</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connectorFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium flex items-center">
                  <div>{file.name}</div>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</TableCell>
                <TableCell>
                  {file.lastSyncedAt ? formatDistanceToNow(file.lastSyncedAt, { addSuffix: true }) : "-"}
                </TableCell>
                <TableCell>{file.status}</TableCell>
                <TableCell className="text-right">
                  <ManageFileMenu id={file.id} tenant={tenant} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div> */}
    </div>
  );
}
