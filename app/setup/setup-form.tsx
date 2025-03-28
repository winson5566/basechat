"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import CreateLogoDialog from "@/components/tenant/logo/create-logo-dialog";
import LogoChanger from "@/components/tenant/logo/logo-changer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupSchema } from "@/lib/api";
import { getTenantPath } from "@/lib/paths";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export default function SetupForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const router = useRouter();
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [logoData, setLogoData] = useState<{
    logoFileName?: string;
    logoObjectName?: string;
    logoUrl?: string;
  } | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFailureMessage(null);

    const res = await fetch("/api/setup", {
      method: "POST",
      body: JSON.stringify({
        ...values,
        ...logoData,
      }),
    });

    if (res.status < 200 || res.status >= 300) {
      setFailureMessage("An unexpected error occurred. Could not finish setup.");
      return;
    }

    const data = await res.json();
    const { tenant } = setupSchema.parse(data);
    router.push(getTenantPath(tenant.slug));
  }

  const handleLogoUpdate = (data: { logoFileName?: string; logoObjectName?: string; logoUrl?: string } | null) => {
    setLogoData(data);
  };

  const handleLogoSuccess = (data: { url: string; fileName: string }) => {
    setLogoData({
      logoFileName: data.fileName,
      logoUrl: data.url,
    });
    setImage(null);
    setImageName(null);
  };

  return (
    <Form {...form}>
      {failureMessage && <div className="text-destructive mb-8">{failureMessage}</div>}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="mb-8 flex flex-col">
              <FormLabel className="mb-4 font-semibold">Company name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Company name"
                  className="py-2 px-4 rounded border border-[#F5F5F7]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        <div>
          <div className="mb-2">
            <Label className="font-semibold text-[16px]">Avatar</Label>
          </div>
          <LogoChanger
            tenant={{
              name: form.getValues("name") || "",
              slug: "",
              logoName: logoData?.logoFileName || null,
              logoUrl: logoData?.logoUrl || null,
            }}
            onLogoUpdate={handleLogoUpdate}
          />
          {image && (
            <CreateLogoDialog
              tenant={{
                slug: "",
              }}
              image={image}
              imageName={imageName}
              onCancel={() => {
                setImage(null);
                setImageName(null);
              }}
              onSuccess={handleLogoSuccess}
            />
          )}
          <hr className="w-full my-8" />
        </div>
        <button
          type="submit"
          className="bg-[#D946EF] fond-semibold text-white flex justify-center w-full py-2.5 rounded-[54px]"
        >
          Build my chatbot
        </button>
      </form>
    </Form>
  );
}
