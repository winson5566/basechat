"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import Cropper, { Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SubmitButton } from "@/components/ui/submit-button";

import { uploadSetupLogo, SetupLogoState } from "./server-actions";
import { getCroppedImage } from "./utils";

export interface OnSuccessEvent {
  url: string;
  fileName: string;
  objectName: string;
}

interface Props {
  image: string;
  imageName?: string | null | undefined;
  onCancel: () => void;
  onSuccess: (event: OnSuccessEvent) => void;
}

export default function SetupLogoDialog({ image, imageName, onCancel, onSuccess }: Props) {
  const [state, formAction] = useActionState(uploadSetupLogo, {
    status: "pending" as const,
  });

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.({
        url: state.url,
        fileName: state.fileName,
        objectName: state.objectName,
      });
    }
  }, [state, onSuccess]);

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          onCancel?.();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <SetupLogoForm
          formState={state}
          formAction={formAction}
          image={image}
          imageName={imageName}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

function SetupLogoForm({
  image,
  imageName,
  formState,
  formAction,
  onCancel,
}: {
  image: string;
  imageName: string | null | undefined;
  formState: SetupLogoState;
  formAction: (payload: FormData) => void;
  onCancel?: () => void;
}) {
  const finalImageRef = useRef<HTMLInputElement>(null);

  const { pending } = useFormStatus();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const zoomArray = useMemo(() => {
    return [zoom];
  }, [zoom]);

  const onCropComplete = async (croppedArea: Area, croppedAreaPixels: Area) => {
    const imageBlob = await getCroppedImage(image, croppedAreaPixels);
    const name = imageName ?? "logo.png";
    if (imageBlob && finalImageRef.current) {
      const file = new File([imageBlob], name, {
        type: "image/png",
        lastModified: new Date().getTime(),
      });
      const container = new DataTransfer();
      container.items.add(file);
      finalImageRef.current.files = container.files;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload logo</DialogTitle>
      </DialogHeader>
      <form action={formAction}>
        <div className="flex flex-col justify-center items-center mb-4">
          <div className="flex flex-col items-center justify-center m-4">
            <div className="relative w-[300px] h-[300px] ">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                minZoom={0.1}
                maxZoom={4}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          </div>
          <div>
            <Label>Zoom</Label>
            <Slider
              className="w-[300px] mt-2"
              min={0.1}
              max={4}
              value={zoomArray}
              step={0.1}
              onValueChange={(values) => setZoom(values[0])}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={pending} onClick={() => onCancel?.()}>
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton pendingText="Uploading...">Upload</SubmitButton>
        </DialogFooter>
        <input ref={finalImageRef} type="file" name="file" className="hidden" />
      </form>
    </>
  );
}
