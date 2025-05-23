"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateTenantSchema } from "@/lib/api";
import * as schema from "@/lib/server/db/schema";

// Transform null to empty string for form field handling
const nullToEmptyString = (v: string | null) => v ?? "";

const formSchema = z.object({
  slackEnabled: z.boolean().default(false),
  slackWebhookUrl: z.string().nullable().default("").transform(nullToEmptyString),
  slackChannel: z.string().nullable().default("").transform(nullToEmptyString),
  slackBotToken: z.string().nullable().default("").transform(nullToEmptyString),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  tenant: typeof schema.tenants.$inferSelect;
};

export default function SlackSettings({ tenant }: Props) {
  const [isLoading, setLoading] = useState(false);

  const formattedTenant = useMemo(() => {
    const { slackEnabled, slackWebhookUrl, slackChannel, slackBotToken, ...otherFields } = tenant;

    // Zod only uses default values when the value is undefined. They come in as null
    // Change fields you want to have defaults to undefined.
    return {
      slackEnabled: slackEnabled ?? undefined,
      slackWebhookUrl: slackWebhookUrl ? slackWebhookUrl : undefined,
      slackChannel: slackChannel ? slackChannel : undefined,
      slackBotToken: slackBotToken ? slackBotToken : undefined,
      ...otherFields,
    };
  }, [tenant]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: formSchema.parse(formattedTenant),
  });

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

      toast.success("Slack settings saved");

      // Reset form with the values to mark it as pristine
      form.reset({
        ...values,
        slackWebhookUrl: values.slackWebhookUrl.length ? values.slackWebhookUrl : undefined,
        slackChannel: values.slackChannel.length ? values.slackChannel : undefined,
        slackBotToken: values.slackBotToken.length ? values.slackBotToken : undefined,
      });
    } catch (error) {
      toast.error("Failed to save changes");
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
        <h1 className="font-bold text-[32px] text-[#343A40]">Slack Integration</h1>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            {/* Enable Slack Integration */}
            <FormField
              control={form.control}
              name="slackEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="font-semibold text-base">Enable Slack Integration</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Allow this workspace to integrate with Slack for notifications and bot interactions
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#D946EF]"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <hr className="w-full my-1" />

            {/* Slack Webhook URL */}
            <FormField
              control={form.control}
              name="slackWebhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-base text-[#343A40]">Slack Webhook URL</FormLabel>
                  <p className="text-sm text-muted-foreground mb-3">
                    The incoming webhook URL from your Slack app for sending notifications
                  </p>
                  <FormControl>
                    <Input
                      placeholder="https://hooks.slack.com/services/..."
                      {...field}
                      disabled={!form.watch("slackEnabled")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slack Channel */}
            <FormField
              control={form.control}
              name="slackChannel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-base text-[#343A40]">Default Channel</FormLabel>
                  <p className="text-sm text-muted-foreground mb-3">
                    The default Slack channel for notifications (e.g., #general, #ai-assistant)
                  </p>
                  <FormControl>
                    <Input placeholder="#general" {...field} disabled={!form.watch("slackEnabled")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slack Bot Token */}
            <FormField
              control={form.control}
              name="slackBotToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-base text-[#343A40]">Bot User OAuth Token</FormLabel>
                  <p className="text-sm text-muted-foreground mb-3">
                    The bot token for advanced Slack integrations (starts with xoxb-)
                  </p>
                  <FormControl>
                    <Input type="password" placeholder="xoxb-..." {...field} disabled={!form.watch("slackEnabled")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}
