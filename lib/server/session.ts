import { headers } from "next/headers";

import authConfig from "@/auth";

export default async function getSession() {
  return await authConfig.api.getSession({
    headers: await headers(),
  });
}
