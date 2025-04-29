"use client";

import { toast } from "sonner";

export default function UploadFileButton({ tenant }: { tenant: { slug: string } }) {
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const validFileTypes = [
      // Plain Text
      "text/plain", // .txt
      "message/rfc822", // .eml
      "text/html", // .html
      "application/json", // .json
      "text/markdown", // .md
      "application/vnd.ms-outlook", // .msg
      "text/x-rst", // .rst
      "application/rtf", // .rtf
      "application/xml", // .xml

      // Images
      "image/png", // .png
      "image/webp", // .webp
      "image/jpeg", // .jpg, .jpeg
      "image/tiff", // .tiff
      "image/bmp", // .bmp
      "image/heic", // .heic

      // Documents
      "text/csv", // .csv
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/epub+zip", // .epub
      "application/vnd.oasis.opendocument.text", // .odt
      "application/pdf", // .pdf
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "text/tab-separated-values", // .tsv
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    ];

    if (!validFileTypes.includes(file.type)) {
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
    input.click();

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(validation.error);
          continue;
        }

        try {
          await handleFileUpload(file);
          toast.success(`Successfully uploaded ${file.name}`);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
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

    const result = await response.json();
    return result;
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
