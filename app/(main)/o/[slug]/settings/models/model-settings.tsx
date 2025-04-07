"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  SearchSettingsField,
  searchSettingsFormSchema,
  SearchSettingsFormValues,
} from "@/app/(main)/o/[slug]/settings/models/search-settings-field";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { updateTenantSchema, updateSearchSettingsSchema, searchSettingsSchema, SearchSettings } from "@/lib/api";
import {
  ALL_VALID_MODELS,
  LLM_DISPLAY_NAMES,
  LLM_LOGO_MAP,
  LLMModel,
  modelArraySchema,
  getEnabledModels,
  modelSchema,
} from "@/lib/llm/types";
import * as schema from "@/lib/server/db/schema";
import { cn } from "@/lib/utils";

const modelsFormSchema = z.object({
  enabledModels: modelArraySchema,
  defaultModel: modelSchema,
});

type FormValues = z.infer<typeof modelsFormSchema>;

type ModelsFieldProps = {
  form: UseFormReturn<FormValues>;
  className?: string;
  defaultModel: LLMModel | null;
};

const ModelsField = ({ form, className, defaultModel }: ModelsFieldProps) => {
  const [hoveredModel, setHoveredModel] = useState<LLMModel | null>(null);

  const handleToggleModel = (model: LLMModel, isEnabled: boolean) => {
    const currentModels = getEnabledModels(form.getValues("enabledModels"));

    if (isEnabled && !currentModels.includes(model)) {
      const newEnabledModels = [...currentModels, model];
      form.setValue("enabledModels", newEnabledModels, {
        shouldDirty: true,
        shouldValidate: true,
      });

      // If this is now the only enabled model, set it as default
      if (newEnabledModels.length === 1) {
        form.setValue("defaultModel", model, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } else if (!isEnabled && currentModels.includes(model)) {
      const newEnabledModels = currentModels.filter((m) => m !== model);
      form.setValue("enabledModels", newEnabledModels, {
        shouldDirty: true,
        shouldValidate: true,
      });

      // If we're disabling the current default model and there's exactly one model left,
      // set the remaining model as default
      if (model === form.getValues("defaultModel") && newEnabledModels.length === 1) {
        form.setValue("defaultModel", newEnabledModels[0], {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
  };

  const handleSetDefault = (model: LLMModel) => {
    form.setValue("defaultModel", model, {
      shouldDirty: true,
      shouldValidate: true,
    });
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
              const isDefault = model === form.getValues("defaultModel");
              const [_, logoPath] = LLM_LOGO_MAP[model as string];
              return (
                <div key={model} onMouseEnter={() => setHoveredModel(model)} onMouseLeave={() => setHoveredModel(null)}>
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
                    <div className="flex items-center gap-4">
                      <div className="w-24 text-right">
                        {isDefault ? (
                          <span className="text-[13px] line-height-[20px] text-black bg-muted px-2 py-1 gap-2 rounded">
                            Default
                          </span>
                        ) : (
                          hoveredModel === model &&
                          isEnabled && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(model)}
                              className="text-sm text-[#7749F8] hover:text-[#7749F8]/80"
                            >
                              Set as default
                            </button>
                          )
                        )}
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggleModel(model, checked)}
                        className="data-[state=checked]:bg-[#7749F8]"
                      />
                    </div>
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

type CombinedFormValues = FormValues & SearchSettingsFormValues;

export default function ModelSettings({ tenant }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Fetch search settings when component mounts
    async function fetchSearchSettings() {
      if (tenant.searchSettingsId) {
        try {
          const res = await fetch(`/api/tenants/current`, {
            headers: { tenant: tenant.slug },
          });

          if (res.ok) {
            const data = await res.json();
            const settings = searchSettingsSchema.parse(data);

            // Update the form with fetched settings
            searchSettingsForm.reset({
              isBreadth: settings.isBreadth,
              overrideBreadth: settings.overrideBreadth,
              rerankEnabled: settings.rerankEnabled,
              overrideRerank: settings.overrideRerank,
              prioritizeRecent: settings.prioritizeRecent,
              overridePrioritizeRecent: settings.overridePrioritizeRecent,
            });
          }
        } catch (error) {
          console.error("Failed to fetch search settings:", error);
          toast.error("Failed to load search settings");
        } finally {
          setIsLoadingSettings(false);
        }
      } else {
        setIsLoadingSettings(false);
      }
    }

    fetchSearchSettings();
  }, [tenant]);

  const formattedTenant = useMemo(() => {
    const { enabledModels, defaultModel, ...otherFields } = tenant;

    // Zod only uses default values when the value is undefined. They come in as null
    // Change fields you want to have defaults to undefined.
    return {
      enabledModels: enabledModels,
      defaultModel: defaultModel ?? undefined,
      ...otherFields,
    };
  }, [tenant]);

  const modelsForm = useForm<FormValues>({
    resolver: zodResolver(modelsFormSchema),
    defaultValues: modelsFormSchema.parse({
      enabledModels: formattedTenant.enabledModels,
      defaultModel: formattedTenant.defaultModel ?? undefined,
    }),
  });

  const searchSettingsForm = useForm<SearchSettingsFormValues>({
    resolver: zodResolver(searchSettingsFormSchema),
    defaultValues: {
      isBreadth: false,
      overrideBreadth: true,
      rerankEnabled: false,
      overrideRerank: true,
      prioritizeRecent: false,
      overridePrioritizeRecent: true,
    },
  });

  if (!mounted) return null;

  async function onSubmit(values: CombinedFormValues) {
    setLoading(true);

    try {
      // Update models
      const modelsPayload = updateTenantSchema.parse({
        enabledModels: values.enabledModels,
        defaultModel: values.defaultModel,
      });
      const modelsRes = await fetch("/api/tenants/current", {
        method: "PATCH",
        headers: { tenant: tenant.slug },
        body: JSON.stringify(modelsPayload),
      });

      if (modelsRes.status !== 200) throw new Error("Failed to save models");

      // Update search settings
      const searchSettingsPayload = updateSearchSettingsSchema.parse({
        isBreadth: values.isBreadth,
        overrideBreadth: values.overrideBreadth,
        rerankEnabled: values.rerankEnabled,
        overrideRerank: values.overrideRerank,
        prioritizeRecent: values.prioritizeRecent,
        overridePrioritizeRecent: values.overridePrioritizeRecent,
      });
      const searchSettingsRes = await fetch(`/api/tenants/current`, {
        method: "PUT",
        headers: { tenant: tenant.slug },
        body: JSON.stringify(searchSettingsPayload),
      });

      if (searchSettingsRes.status !== 200) throw new Error("Failed to save search settings");

      toast.success("Changes saved");
      modelsForm.reset({
        enabledModels: values.enabledModels,
        defaultModel: values.defaultModel,
      });
      searchSettingsForm.reset({
        isBreadth: values.isBreadth,
        overrideBreadth: values.overrideBreadth,
        rerankEnabled: values.rerankEnabled,
        overrideRerank: values.overrideRerank,
        prioritizeRecent: values.prioritizeRecent,
        overridePrioritizeRecent: values.overridePrioritizeRecent,
      });
    } catch (error) {
      toast.error("Failed to save changes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    modelsForm.reset({
      enabledModels: formattedTenant.enabledModels,
      defaultModel: formattedTenant.defaultModel ?? undefined,
    });
    searchSettingsForm.reset();
  }

  return (
    <div className="w-full p-4 flex-grow flex flex-col relative">
      <div className="flex w-full justify-between items-center mb-16">
        <h1 className="font-bold text-[32px]">Models</h1>
        <div className="flex justify-end">
          <button
            type="reset"
            className="rounded-lg disabled:opacity-[55%] px-4 py-2.5 mr-3"
            disabled={!modelsForm.formState.isDirty && !searchSettingsForm.formState.isDirty}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#D946EF] text-white disabled:opacity-[55%] px-4 py-2.5 flex items-center"
            disabled={(!modelsForm.formState.isDirty && !searchSettingsForm.formState.isDirty) || isLoading}
            onClick={() => {
              const modelsValues = modelsForm.getValues();
              const searchSettingsValues = searchSettingsForm.getValues();
              onSubmit({ ...modelsValues, ...searchSettingsValues });
            }}
          >
            Save
            {isLoading && <Loader2 size={18} className="ml-2 animate-spin" />}
          </button>
        </div>
      </div>

      <Form {...modelsForm}>
        <form onSubmit={modelsForm.handleSubmit(() => {})}>
          <div>
            <ModelsField form={modelsForm} defaultModel={modelsForm.getValues("defaultModel")} />
          </div>
        </form>
      </Form>

      <div className="h-16" />

      <SearchSettingsField form={searchSettingsForm} />
    </div>
  );
}
