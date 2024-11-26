import { z } from "zod";

import { RAGIE_API_KEY, RAGIE_API_BASE_URL } from "./settings";

const ragieConnectionSchema = z.object({
  id: z.string(),
  source_display_name: z.string(),
});

// FIXME: Temporary until the ragie clients include this method
export async function getRagieConnection(id: string) {
  const response = await fetch(`${RAGIE_API_BASE_URL}/connections/${id}`, {
    headers: { authorization: `Bearer ${RAGIE_API_KEY}` },
  });
  if (response.status !== 200) {
    throw new Error("Could not get ragie connection");
  }
  const body = await response.json();
  return ragieConnectionSchema.parse(body);
}
