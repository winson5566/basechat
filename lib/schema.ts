import { z } from "zod";

export const GenerateResponseSchema = z.object({
  usedSourceIndexes: z.array(z.number().describe("The indexes of the sources used in the response")),
  message: z.string().describe("The response message"),
});

export const GenerateRequestSchema = z.object({
  content: z.string().describe("The request message"),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
