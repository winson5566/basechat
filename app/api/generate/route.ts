import { NextRequest } from "next/server";
import { z } from "zod";

import { generate } from "@/lib/service";

export const dynamic = "force-dynamic";

const MessagePayload = z.object({
  content: z.string(),
});

export async function POST(request: NextRequest) {
  const payload = MessagePayload.parse(await request.json());
  return generate(payload);
}
