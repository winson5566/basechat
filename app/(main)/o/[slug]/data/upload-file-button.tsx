"use client";

import { toast } from "sonner";

const VALID_FILE_TYPES = {
  // Plain Text
  ".txt": "text/plain",
  ".eml": "message/rfc822",
  ".html": "text/html",
  ".json": "application/json",
  ".md": "text/markdown",
  ".msg": "application/vnd.ms-outlook",
  ".rst": "text/x-rst",
  ".rtf": "application/rtf",
  ".xml": "application/xml",

  // Images
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".tiff": "image/tiff",
  ".bmp": "image/bmp",
  ".heic": "image/heic",

  // Documents
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".epub": "application/epub+zip",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".pdf": "application/pdf",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".tsv": "text/tab-separated-values",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

export default function UploadFileButton({ tenant }: { tenant: { slug: string } }) {
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidExtension = fileExtension in VALID_FILE_TYPES;
    const isValidMimeType = Object.values(VALID_FILE_TYPES).includes(file.type as any);

    if (!isValidExtension && !isValidMimeType) {
      return {
        isValid: false,
        error: "Please upload a supported file type",
      };
    }

    // Check file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 500MB",
      };
    }

    return { isValid: true };
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = [...Object.keys(VALID_FILE_TYPES), ...Object.values(VALID_FILE_TYPES)].join(",");
    input.click();

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const uploadPromises = Array.from(files).map(async (file) => {
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(validation.error);
          return;
        }

        try {
          await handleFileUpload(file);
          toast.success(`Successfully uploaded ${file.name}`);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}`);
        }
      });

      await Promise.all(uploadPromises);
    };
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/ragie/upload", {
      method: "POST",
      headers: {
        tenant: tenant.slug,
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Failed to upload file");
    }
  };

  return (
    <button
      className="flex items-center rounded-[40px] h-[40px] px-5 bg-[#F5F5F7] border border-[#D7D7D7] font-semibold"
      onClick={handleUpload}
    >
      <div className="mr-2">Upload File</div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 4L8 12M8 4L5 7M8 4L11 7"
          stroke="#1C1B1F"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
