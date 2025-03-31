"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateTenantSchema } from "@/lib/api";
import { DEFAULT_GROUNDING_PROMPT, DEFAULT_SYSTEM_PROMPT } from "@/lib/constants";
import { ALL_VALID_MODELS, LLM_DISPLAY_NAMES, LLMModel } from "@/lib/llm/types";
import * as schema from "@/lib/server/db/schema";
import { cn } from "@/lib/utils";

import { HelpGroundingPromptDialog } from "../help-grounding-prompt-dialog";
import { HelpSystemPromptDialog } from "../help-system-prompt-dialog";

// Transform null to empty string for form field handling
const nullToEmptyString = (v: string | null) => v ?? "";

const isValidSlug = (slug: string) => {
  if (!slug || slug.trim().length === 0) return false;
  const sanitized = slug
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === sanitized;
};

const formSchema = z.object({
  groundingPrompt: z.string().nullable().default(DEFAULT_GROUNDING_PROMPT).transform(nullToEmptyString),
  systemPrompt: z.string().nullable().default(DEFAULT_SYSTEM_PROMPT).transform(nullToEmptyString),
  slug: z.string().nullable().transform(nullToEmptyString).refine(isValidSlug, {
    message: "URL can only contain lowercase letters, numbers, and hyphens",
  }),
  isPublic: z.boolean().default(false),
  enabledModels: z.array(z.string()).default(ALL_VALID_MODELS),
});

type FormValues = z.infer<typeof formSchema>;

type URLFieldProps = {
  name: keyof FormValues;
  label: string;
  form: UseFormReturn<FormValues, any, undefined>;
};

const URLField = ({ form, name, label }: URLFieldProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleCopyUrl = () => {
    const url = `${origin}/o/${form.getValues(name) || "your-chat-name"}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col mt-8">
          <FormLabel className="font-semibold text-[16px] mb-3">{label}</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="Enter URL"
              className="rounded-[8px] border border-[#D7D7D7] h-[58px] placeholder-[#74747A] text-[16px]"
              {...field}
              value={String(field.value)}
            />
          </FormControl>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span>
              Your chat will be available at: {origin}/o/{field.value || "your-chat-name"}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy URL"
            >
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-black" />}
            </button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

type TextAreaFieldProps = {
  name: keyof FormValues;
  label: string;
  form: UseFormReturn<FormValues, any, undefined>;
  help?: React.ReactNode;
  className?: string;
  hasDefault?: boolean;
};

const TextAreaField = ({ form, name, label, className, help, hasDefault }: TextAreaFieldProps) => {
  const getDefaultValue = () => {
    switch (name) {
      case "systemPrompt":
        return DEFAULT_SYSTEM_PROMPT;
      case "groundingPrompt":
        return DEFAULT_GROUNDING_PROMPT;
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
              <AutosizeTextarea className="pt-1.5" minHeight={80} {...field} value={String(field.value)} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

type SwitchFieldProps = {
  name: keyof FormValues;
  label: string;
  form: UseFormReturn<FormValues, any, undefined>;
};

const SwitchField = ({ form, name, label }: SwitchFieldProps) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-row items-center justify-between mt-8">
        <div className="space-y-0.5">
          <FormLabel className="font-semibold text-[16px]">{label}</FormLabel>
          <p className="text-sm text-muted-foreground">Anyone with the link can chat with your AI assistant</p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <FormControl>
            <Switch
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
              className="data-[state=checked]:bg-[#D946EF]"
            />
          </FormControl>
        </div>
      </FormItem>
    )}
  />
);

type ModelsFieldProps = {
  form: UseFormReturn<FormValues, any, undefined>;
};

const ModelsField = ({ form }: ModelsFieldProps) => {
  const handleToggleModel = (model: string, isEnabled: boolean) => {
    const currentModels = form.getValues("enabledModels") || [];

    if (isEnabled && !currentModels.includes(model)) {
      form.setValue("enabledModels", [...currentModels, model], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (!isEnabled && currentModels.includes(model)) {
      form.setValue(
        "enabledModels",
        currentModels.filter((m) => m !== model),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };

  return (
    <FormField
      control={form.control}
      name="enabledModels"
      render={({ field }) => (
        <FormItem className="flex flex-col mt-8">
          <FormLabel className="font-semibold text-[16px] mb-3">Enabled Models</FormLabel>
          <div className="space-y-4">
            {ALL_VALID_MODELS.map((model) => {
              const isEnabled = field.value?.includes(model);
              return (
                <div key={model} className="flex items-center justify-between">
                  <div className="text-base">{LLM_DISPLAY_NAMES[model as LLMModel]}</div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggleModel(model, checked)}
                    className="data-[state=checked]:bg-[#D946EF]"
                  />
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Select which AI models will be available in your chat</p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

type Props = {
  tenant: typeof schema.tenants.$inferSelect;
};

export default function AdvancedSettings({ tenant }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const formattedTenant = useMemo(() => {
    const { groundingPrompt, systemPrompt, enabledModels, ...otherFields } = tenant;

    // Zod only uses default values when the value is undefined. They come in as null
    // Change fields you want to have defaults to undefined.
    return {
      groundingPrompt: groundingPrompt ? groundingPrompt : undefined,
      systemPrompt: systemPrompt ? systemPrompt : undefined,
      // If enabledModels is available in tenant, use it; otherwise default to all models
      enabledModels: enabledModels ? enabledModels : ALL_VALID_MODELS,
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
      // If the slug has changed, check if it's available
      if (values.slug !== tenant.slug) {
        const checkResponse = await fetch("/api/tenants/check-slug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: values.slug,
            tenantId: tenant.id,
          }),
        });

        if (!checkResponse.ok) {
          throw new Error("Failed to check slug availability");
        }

        const { available } = await checkResponse.json();
        if (!available) {
          toast.error("This URL is already taken. Please choose a different one.");
          setLoading(false);
          return;
        }
      }

      const payload = updateTenantSchema.parse(values);
      //const payload = updateTenantSchema.parse({
      //  ...values,
      //  // Ensure we're sending enabledModels correctly
      //  enabledModels: values.enabledModels || ALL_VALID_MODELS,
      //});
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
        groundingPrompt: values.groundingPrompt.length ? values.groundingPrompt : undefined,
        systemPrompt: values.systemPrompt.length ? values.systemPrompt : undefined,
      });

      // If the slug was changed, redirect to the new URL
      if (values.slug !== tenant.slug) {
        router.push(`/o/${values.slug}/settings/advanced`);
      }
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
      <div className="flex w-full justify-between items-center">
        <h1 className="font-bold text-[32px] mb-16">Advanced Settings</h1>
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <TextAreaField
              form={form}
              name="groundingPrompt"
              label="Grounding Prompt"
              help={<HelpGroundingPromptDialog />}
              hasDefault={true}
            />

            <TextAreaField
              form={form}
              name="systemPrompt"
              label="System Prompt"
              help={<HelpSystemPromptDialog />}
              className="mt-8 mb-4"
              hasDefault={true}
            />

            <hr className="w-full my-8" />

            <URLField form={form} name="slug" label="URL name" />
            <hr className="w-full my-8" />
            <SwitchField form={form} name="isPublic" label="Enable public chat" />
            <hr className="w-full my-8" />
            <ModelsField form={form} />
            <hr className="w-full my-8" />
          </div>
        </form>
      </Form>
    </div>
  );
}
