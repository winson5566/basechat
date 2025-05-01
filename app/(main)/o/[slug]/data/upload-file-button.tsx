"use client";

import { toast } from "sonner";

import { VALID_FILE_TYPES, uploadFile, validateFile } from "@/lib/file-utils";

export default function UploadFileButton({ tenant }: { tenant: { slug: string } }) {
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
          await uploadFile(file, tenant.slug);
          toast.success(`Successfully uploaded ${file.name}`);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}`);
        }
      });

      await Promise.all(uploadPromises);
    };
  };

  return (
    <button
      className="flex items-center rounded-[40px] h-[40px] px-5 bg-[#FFFFFF] border border-[#D7D7D7] font-semibold"
      onClick={handleUpload}
    >
      <div>Upload File</div>
    </button>
  );
}
