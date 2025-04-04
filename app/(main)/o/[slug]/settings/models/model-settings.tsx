"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { updateTenantSchema } from "@/lib/api";
import {
  ALL_VALID_MODELS,
  LLM_DISPLAY_NAMES,
  LLM_LOGO_MAP,
  LLMModel,
  modelArraySchema,
  getEnabledModels,
} from "@/lib/llm/types";
import * as schema from "@/lib/server/db/schema";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  enabledModels: modelArraySchema,
});

type FormValues = z.infer<typeof formSchema>;

type ModelsFieldProps = {
  form: UseFormReturn<FormValues>;
  className?: string;
};

const ModelsField = ({ form, className }: ModelsFieldProps) => {
  const handleToggleModel = (model: LLMModel, isEnabled: boolean) => {
    const currentModels = getEnabledModels(form.getValues("enabledModels"));

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
        <FormItem className={cn("flex flex-col", className)}>
          <div className="mb-5">
            <FormLabel className="font-semibold text-base">Models</FormLabel>
            <p className="text-sm text-muted-foreground">Choose which models can be used by this chatbot</p>
          </div>
          <div className="space-y-5 pl-8">
            {ALL_VALID_MODELS.map((model) => {
              const isEnabled = field.value?.includes(model);
              const [_, logoPath] = LLM_LOGO_MAP[model as string];
              return (
                <div key={model}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Image
                        src={logoPath}
                        alt={LLM_DISPLAY_NAMES[model as string]}
                        width={20}
                        height={20}
                        className="mr-2"
                      />
                      <div className="text-base">{LLM_DISPLAY_NAMES[model as string]}</div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleModel(model, checked)}
                      className="data-[state=checked]:bg-[#D946EF]"
                    />
                  </div>
                  <hr className="w-full my-4" />
                </div>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

type Props = {
  tenant: typeof schema.tenants.$inferSelect;
};

export default function ModelSettings({ tenant }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const formattedTenant = useMemo(() => {
    const { enabledModels, ...otherFields } = tenant;

    // Zod only uses default values when the value is undefined. They come in as null
    // Change fields you want to have defaults to undefined.
    return {
      enabledModels: enabledModels,
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
      form.reset(values);
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
      <div className="flex w-full justify-between items-center mb-16">
        <h1 className="font-bold text-[32px]">Models</h1>
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
            <ModelsField form={form} />
          </div>
        </form>
      </Form>
      <div className="h-32" />
    </div>
  );
}
