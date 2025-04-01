"use server";

import { z, ZodError } from "zod";

import auth from "@/auth";
import * as settings from "@/lib/server/settings";

interface ResetFormState {
  error?: string[];
  email?: string;
}

export async function handleResetPassword(prevState: ResetFormState, formData: FormData): Promise<ResetFormState> {
  let email;
  try {
    email = z.string().email().parse(formData.get("email"));
  } catch (e) {
    if (!(e instanceof ZodError)) throw e;
    return { error: e.errors.map((e) => e.message) };
  }

  await auth.api.forgetPassword({
    body: {
      email,
      callbackUrl: "/test",
    },
  });
  return { email };
}
