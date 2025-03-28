"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import LogoChanger from "@/components/tenant/logo/logo-changer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupRequestSchema, setupResponseSchema } from "@/lib/api";
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
  const [logoInfo, setLogoInfo] = useState<{
    logoUrl: string;
    logoFileName: string;
    logoObjectName: string;
  } | null>(null);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFailureMessage(null);

    //this is the only place we call this endpoint
    //TODO: make sure this is consistent with setupSchema vs setupRequestSchema
    // which is in api.ts but also the route.ts itself?
    const res = await fetch("/api/setup", {
      method: "POST",
      body: JSON.stringify({
        ...values,
        ...(logoInfo && {
          logoUrl: logoInfo.logoUrl,
          logoFileName: logoInfo.logoFileName,
          logoObjectName: logoInfo.logoObjectName,
        }),
      }),
    });

    const data = await res.json();
    if (res.status < 200 || res.status >= 300) {
      setFailureMessage(data.error || "An unexpected error occurred. Could not finish setup.");
      return;
    }
    try {
      const { tenant } = setupResponseSchema.parse(data);
      router.push(getTenantPath(tenant.slug));
    } catch (error) {
      setFailureMessage("Invalid response from server. Please try again.");
    }
  }

  const handleLogoSuccess = ({ url, fileName }: { url: string; fileName: string }) => {
    // Extract object name from URL
    const objectName = url.split("/").pop() || "";
    setLogoInfo({
      logoUrl: url,
      logoFileName: fileName,
      logoObjectName: objectName,
    });
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
              name: form.getValues("name") || "New Company",
              slug: "setup",
              logoUrl: logoInfo?.logoUrl || null,
              logoName: logoInfo?.logoFileName || null,
            }}
            onLogoSuccess={handleLogoSuccess}
            isSetup={true}
          />
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
