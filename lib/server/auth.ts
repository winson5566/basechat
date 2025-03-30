import { headers } from "next/headers";

import authConfig from "@/auth";

export default async function auth() {
  return await authConfig.api.getSession({
    headers: await headers(),
  });
}
