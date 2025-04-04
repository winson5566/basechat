import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const searchSettingsFormSchema = z.object({
  isBreadth: z.boolean(),
  overrideBreadth: z.boolean(),
  rerankEnabled: z.boolean(),
  overrideRerank: z.boolean(),
  prioritizeRecent: z.boolean(),
  overridePrioritizeRecent: z.boolean(),
});

export type SearchSettingsFormValues = z.infer<typeof searchSettingsFormSchema>;

interface SearchSettingsFieldProps {
  form: UseFormReturn<SearchSettingsFormValues>;
  className?: string;
}

export function SearchSettingsField({ form, className }: SearchSettingsFieldProps) {
  return (
    <Form {...form}>
      <div className={cn("flex flex-col gap-6", className)}>
        <div>
          <FormLabel className="font-semibold text-base">Search Settings</FormLabel>
          <p className="text-sm text-muted-foreground">Configure default search settings for all users</p>
        </div>

        {/* Breadth/Depth Setting */}
        <FormField
          control={form.control}
          name="isBreadth"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Search Mode</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === "breadth")}
                  defaultValue={field.value ? "breadth" : "depth"}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="breadth"
                        id="breadth"
                        className="text-[#D946EF] border-[#D7D7D7] data-[state=checked]:bg-[#D946EF]"
                      />
                      <label htmlFor="breadth" className="text-sm">
                        Breadth
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">
                      Searches a wider range of documents for a broader response (slower)
                    </span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="depth"
                        id="depth"
                        className="text-[#D946EF] border-[#D7D7D7] data-[state=checked]:bg-[#D946EF]"
                      />
                      <label htmlFor="depth" className="text-sm">
                        Depth
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">
                      Retrieves results from a smaller range of documents for more depth (faster)
                    </span>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="overrideBreadth"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Allow users to change search mode</FormLabel>
                <p className="text-sm text-muted-foreground">Users can override the default search mode setting</p>
              </div>
            </FormItem>
          )}
        />

        <div className="h-[1px] w-full bg-[#D7D7D7] my-4" />

        {/* Rerank Setting */}
        <FormField
          control={form.control}
          name="rerankEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Rerank</FormLabel>
                <p className="text-sm text-muted-foreground">Reorder search results for better relevance</p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-[#D946EF]"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="overrideRerank"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Allow users to change rerank setting</FormLabel>
                <p className="text-sm text-muted-foreground">Users can override the default rerank setting</p>
              </div>
            </FormItem>
          )}
        />

        <div className="h-[1px] w-full bg-[#D7D7D7] my-4" />

        {/* Prioritize Recent Setting */}
        <FormField
          control={form.control}
          name="prioritizeRecent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Prioritize recent data</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Give preference to more recent documents in search results
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-[#D946EF]"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="overridePrioritizeRecent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Allow users to change recency bias</FormLabel>
                <p className="text-sm text-muted-foreground">Users can override the default recency bias setting</p>
              </div>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
