"use client";

import { Image as LucideImage } from "lucide-react";
import { ChangeEvent } from "react";
import { toast } from "sonner";

export interface FileCreateEvent {
  action: "create";
  data: string;
  fileName: string;
}

export interface FileDeleteEvent {
  action: "delete";
}

interface Props {
  imageName?: string | null;
  fileName?: string | null;
  imageUrl?: string | null;
  onChange?: (event: FileCreateEvent | FileDeleteEvent) => void;
}

export default function UploadableLogo({ imageName, imageUrl, onChange }: Props) {
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validImageTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Please upload an image file (JPEG, PNG, GIF, or WebP)",
      };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 10MB",
      };
    }

    return { isValid: true };
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validation = validateFile(file);

      if (!validation.isValid) {
        toast.error(validation.error);
        e.target.value = "";
        return;
      }

      let imageDataUrl = await readFile(file);

      if (imageDataUrl) {
        onChange?.({
          action: "create",
          data: imageDataUrl,
          fileName: file.name,
        });
      }
    }

    // Clear the input value so that the same image triggers a change event again.
    e.target.value = "";
  };

  if (imageUrl) {
    return (
      <div className="flex gap-4 items-center">
        <Logo url={imageUrl} />
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="text-[#1D1D1F] font-semibold">{imageName}</div>
          <div className="flex gap-4">
            <label htmlFor="logo-upload" className="text-[#D946EF] cursor-pointer">
              <input type="file" id="logo-upload" name="logo-upload" onChange={onFileChange} className="hidden" />
              Update image
            </label>
            <button className="text-[#FF524A]" onClick={() => onChange?.({ action: "delete" })}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-center">
      <Logo url={imageUrl} />
      <div className="flex flex-col gap-2 text-[14px]">
        <label htmlFor="logo-upload" className="text-[#D946EF] cursor-pointer">
          <input type="file" id="logo-upload" name="logo-upload" onChange={onFileChange} className="hidden" />
          Choose file
        </label>
        <p className="text-[#86868B]">Recommended size: 250x250</p>
      </div>
    </div>
  );
}

function readFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        const result = reader.result;
        if (result instanceof ArrayBuffer) {
          resolve(null);
          return;
        }

        resolve(result);
      },
      false,
    );
    reader.readAsDataURL(file);
  });
}

function Logo({ url }: { url?: string | null }) {
  if (url) {
    // These images could come from any source, <Image /> would need additional set up per external resource
    // Just use <img /> for now.
    // https://nextjs.org/docs/pages/api-reference/components/image#remotepatterns
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} className="rounded" height={80} width={80} alt="Logo" />;
  }

  return (
    <div className="bg-[#F5F5F7] h-[80px] w-[80px] flex items-center justify-center rounded-full">
      <LucideImage />
    </div>
  );
}
