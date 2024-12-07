"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

// This page exists because it is not possible update the
// user's session on the server side with Auth.js.
export default function SetupFinishPage() {
  const { update } = useSession();
  const router = useRouter();

  const complete = async () => {
    await update({ setup: true });
    router.push("/");
  };

  useEffect(() => {
    (async () => {
      await complete();
    })();
  }, []);

  return null;
}
