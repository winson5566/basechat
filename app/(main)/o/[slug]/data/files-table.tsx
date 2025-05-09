"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Dropzone from "react-dropzone";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CONNECTOR_MAP from "@/lib/connector-map";
import { MAX_FILE_SIZE, getDropzoneAcceptConfig, uploadFile, validateFile } from "@/lib/file-utils";
import { getStatusDisplayName } from "@/lib/utils";

import ManageFileMenu from "./manage-file-menu";

interface Props {
  tenant: {
    id: string;
    slug: string;
  };
  initialFiles: any[];
  nextCursor: string | null;
  userName: string;
  connectionMap: Record<
    string,
    {
      sourceType: string;
      addedBy: string | null;
    }
  >;
}

export default function FilesTable({ tenant, initialFiles, nextCursor, userName, connectionMap }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allFiles, setAllFiles] = useState(initialFiles);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentCursor = searchParams.get("cursor") || null;
  const historyParam = searchParams.get("history") || "";
  const cursorHistory = historyParam ? historyParam.split(",") : [];

  // update the table if a file has been deleted
  const handleFileRemoved = (fileId: string) => {
    setAllFiles((prev) => {
      const index = prev.findIndex((file) => file.id === fileId);
      if (index === -1) return prev; // File not found
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const fetchFiles = async (cursor: string | null) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tenants/current/documents?cursor=${cursor ?? ""}`, {
        headers: { tenant: tenant.slug },
      });
      const data = await response.json();

      if (data.documents) {
        setAllFiles(data.documents);
      }
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch files when cursor changes
  useEffect(() => {
    fetchFiles(currentCursor);
  }, [currentCursor]);

  // Poll for file status updates
  useEffect(() => {
    const checkFilesStatus = async () => {
      try {
        const response = await fetch("/api/tenants/current/documents", {
          headers: { tenant: tenant.slug },
        });
        const data = await response.json();

        if (data.documents) {
          // Only update the status of existing files
          setAllFiles((prev) =>
            prev.map((file) => {
              const updatedFile = data.documents.find((d: any) => d.id === file.id);
              return updatedFile || file;
            }),
          );

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

  const handleNavigation = (cursor: string | null) => {
    if (cursor === null) {
      // Going back to first page
      router.push("?cursor=");
    } else {
      // Going forward
      const newHistory = [...cursorHistory, currentCursor || ""].filter(Boolean);
      router.push(`?cursor=${cursor}&history=${newHistory.join(",")}`);
    }
  };

  const handlePreviousPage = () => {
    if (cursorHistory.length === 0) {
      // If no history, go to first page
      router.push("?cursor=");
    } else {
      // Get the last cursor from history
      const previousCursor = cursorHistory[cursorHistory.length - 1];
      const newHistory = cursorHistory.slice(0, -1);
      router.push(`?cursor=${previousCursor}${newHistory.length ? `&history=${newHistory.join(",")}` : ""}`);
    }
  };

  return (
    <Dropzone
      onDrop={async (acceptedFiles: File[]) => {
        const uploadPromises = acceptedFiles.map(async (file) => {
          const validation = validateFile(file);
          if (!validation.isValid) {
            toast.error(validation.error);
            return;
          }
          const toastId = toast.loading(`Uploading ${file.name}...`);

          try {
            await uploadFile(file, tenant.slug, userName);
            toast.success(`Successfully uploaded ${file.name}`, {
              id: toastId,
            });
            router.refresh();
          } catch (err) {
            toast.error(`Failed to upload ${file.name}`, {
              id: toastId,
            });
          }
        });

        await Promise.all(uploadPromises);
      }}
      accept={getDropzoneAcceptConfig()}
      maxSize={MAX_FILE_SIZE}
      onDragEnter={() => setIsDragActive(true)}
      onDragLeave={() => setIsDragActive(false)}
      onDropAccepted={() => setIsDragActive(false)}
      onDropRejected={() => setIsDragActive(false)}
      noClick
    >
      {({ getRootProps, getInputProps }) => (
        <div className="h-full w-full flex flex-col" {...getRootProps()}>
          <input {...getInputProps()} />
          <hr className="my-4" />
          <div className="flex justify-end items-center mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={!currentCursor && cursorHistory.length === 0}
                className={`p-1 rounded-md ${!currentCursor && cursorHistory.length === 0 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleNavigation(nextCursor)}
                disabled={!nextCursor}
                className={`p-1 rounded-md ${!nextCursor ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div
            className={`flex-1 overflow-y-auto relative ${isDragActive ? "after:content-[''] after:absolute after:inset-0 after:bg-[#F0F7FF] after:border-2 after:border-[#007AFF] after:border-dashed after:rounded-lg after:pointer-events-none" : ""}`}
          >
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#006EDB]" />
              </div>
            ) : (
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
                  {allFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium flex items-center">
                        <div>{file.name}</div>
                      </TableCell>
                      <TableCell>
                        {file.metadata?.source_type && file.metadata.source_type !== "manual" ? (
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
                      <TableCell>
                        {file.metadata?.source_type && file.metadata.source_type !== "manual" ? (
                          <div>{connectionMap[file.metadata.source_type]?.addedBy || "-"}</div>
                        ) : (
                          file.metadata.added_by || "-"
                        )}
                      </TableCell>
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
                        <ManageFileMenu
                          id={file.id}
                          tenant={tenant}
                          isConnectorFile={file.metadata?.source_type && file.metadata.source_type !== "manual"}
                          onFileRemoved={handleFileRemoved}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </Dropzone>
  );
}
