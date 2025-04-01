"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import LogoChanger from "@/components/tenant/logo/logo-changer";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTenantSchema } from "@/lib/api";
import { DEFAULT_WELCOME_MESSAGE } from "@/lib/constants";
import * as schema from "@/lib/server/db/schema";
import { cn } from "@/lib/utils";

import { HelpWelcomeMessageDialog } from "./help-welcome-message-dialog";

// Transform null to empty string for form field handling
const nullToEmptyString = (v: string | null) => v ?? "";

const formSchema = z.object({
  question1: z.string().nullable().transform(nullToEmptyString),
  question2: z.string().nullable().transform(nullToEmptyString),
  question3: z.string().nullable().transform(nullToEmptyString),
  welcomeMessage: z.string().nullable().default(DEFAULT_WELCOME_MESSAGE).transform(nullToEmptyString),
  name: z.string().min(1, "Name must be at least 1 character").max(30, "Name must be less than 30 characters"),
});

type FormValues = z.infer<typeof formSchema>;

type QuestionFieldProps = {
  name: keyof FormValues;
  label: string;
  form: UseFormReturn<FormValues>;
};

const QuestionField = ({ form, name, label }: QuestionFieldProps) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-col mt-8">
        <FormLabel className="font-semibold text-[16px] mb-3">{label}</FormLabel>
        <FormControl>
          <Input
            type="text"
            placeholder="Type something"
            className="rounded-[8px] border border-[#D7D7D7] h-[58px] placeholder-[#74747A] text-[16px]"
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

type TextAreaFieldProps = {
  name: keyof FormValues;
  label: string;
  form: UseFormReturn<FormValues>;
  help?: React.ReactNode;
  className?: string;
  hasDefault?: boolean;
};

const TextAreaField = ({ form, name, label, className, help, hasDefault }: TextAreaFieldProps) => {
  const getDefaultValue = () => {
    switch (name) {
      case "welcomeMessage":
        return DEFAULT_WELCOME_MESSAGE;
      default:
        return "";
    }
  };

  const handleReset = () => {
    form.setValue(name, getDefaultValue(), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          <FormLabel className="font-semibold text-[16px] mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {label} {help}
            </div>
            {hasDefault && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-[#D946EF] hover:text-foreground transition-colors"
              >
                Reset
              </button>
            )}
          </FormLabel>
          <FormControl>
            <div className="rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
              <AutosizeTextarea className="pt-1.5" minHeight={80} {...field} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

type CompanyNameFieldProps = {
  name: keyof FormValues;
  label: string;
  form: UseFormReturn<FormValues>;
};

const CompanyNameField = ({ form, name, label }: CompanyNameFieldProps) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="font-semibold text-[16px] mb-3">{label}</FormLabel>
          <FormControl>
            <Input
              type="text"
              className="rounded-[8px] border border-[#D7D7D7] h-[58px] placeholder-[#74747A] text-[16px]"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

type Props = {
  tenant: typeof schema.tenants.$inferSelect;
  canUploadLogo?: boolean;
};

export default function GeneralSettings({ tenant, canUploadLogo }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const formattedTenant = useMemo(() => {
    const { welcomeMessage, ...otherFields } = tenant;

    // Zod only uses default values when the value is undefined. They come in as null
    // Change fields you want to have defaults to undefined.
    return {
      welcomeMessage: welcomeMessage ? welcomeMessage : undefined,
      ...otherFields,
    };
  }, [tenant]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: formSchema.parse(formattedTenant),
  });

  if (!mounted) return null;

  async function onSubmit(values: FormValues) {
    setLoading(true);

    try {
      const payload = updateTenantSchema.parse(values);
      const res = await fetch("/api/tenants/current", {
        method: "PATCH",
        headers: { tenant: tenant.slug },
        body: JSON.stringify(payload),
      });

      if (res.status !== 200) throw new Error("Failed to save");

      toast.success("Changes saved");

      // If the prompts are empty strings, set them to undefined so we get the default value from the schema.
      form.reset({
        ...values,
        welcomeMessage: values.welcomeMessage.length ? values.welcomeMessage : undefined,
      });
    } catch (error) {
      toast.error("Failed to save changes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    form.reset();
  }

  return (
    <div className="w-full p-4 flex-grow flex flex-col relative">
      <div
        className={cn("flex w-full justify-between items-center", {
          "mb-8": !canUploadLogo,
        })}
      >
        <h1 className="font-bold text-[32px]">Settings</h1>
        <div className="flex justify-end">
          <button
            type="reset"
            className="rounded-lg disabled:opacity-[55%] px-4 py-2.5 mr-3"
            disabled={!form.formState.isDirty}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#D946EF] text-white disabled:opacity-[55%] px-4 py-2.5 flex items-center"
            disabled={!form.formState.isDirty || isLoading}
            onClick={form.handleSubmit(onSubmit)}
          >
            Save
            {isLoading && <Loader2 size={18} className="ml-2 animate-spin" />}
          </button>
        </div>
      </div>
      {canUploadLogo && (
        <div>
          <div className="mb-2">
            <Label className="font-semibold text-[16px]">Avatar</Label>
          </div>
          <LogoChanger tenant={tenant} />
          <hr className="w-full my-8" />
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <CompanyNameField form={form} name="name" label="Company Name" />
            <hr className="w-full my-8" />
            <TextAreaField
              form={form}
              name="welcomeMessage"
              label="Welcome Message"
              help={<HelpWelcomeMessageDialog />}
              className="mt-8 mb-4"
              hasDefault={true}
            />

            <hr className="w-full my-8" />

            <h3 className="font-semibold text-[16px]">Example questions to help your users get started</h3>

            <QuestionField form={form} name="question1" label="Question 1" />
            <QuestionField form={form} name="question2" label="Question 2" />
            <QuestionField form={form} name="question3" label="Question 3" />

            <hr className="w-full my-8" />
          </div>
        </form>
      </Form>
    </div>
  );
}
