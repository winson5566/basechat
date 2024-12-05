import { Ragie } from "ragie";
import { z } from "zod";

import * as settings from "./settings";

const ragieConnectionSchema = z.object({
  id: z.string(),
  source_display_name: z.string(),
  partition: z.string().nullable(),
});

// FIXME: Temporary until the ragie clients include this method
export async function getRagieConnection(id: string) {
  const response = await fetch(`${settings.RAGIE_API_BASE_URL}/connections/${id}`, {
    headers: { authorization: `Bearer ${settings.RAGIE_API_KEY}` },
  });
  if (response.status !== 200) {
    throw new Error("Could not get ragie connection");
  }
  const body = await response.json();
  return ragieConnectionSchema.parse(body);
}

export function getRagieClient() {
  return new Ragie({ auth: settings.RAGIE_API_KEY, serverURL: settings.RAGIE_API_BASE_URL });
}
