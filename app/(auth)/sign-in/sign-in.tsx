"use client";

import { useState } from "react";

import { signIn } from "@/lib/auth-client";
import { getStartPath } from "@/lib/paths";

import { Button } from "../common";

export default function SignIn({ redirectTo, reset }: { redirectTo?: string; reset?: boolean }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await signIn.email({
      email,
      password,
      callbackURL: redirectTo || getStartPath(),
      fetchOptions: {
        onError: (error) => {
          setError(error.error.message);
        },
      },
    });
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(reset ? "Your password has been reset. Please sign in again." : "");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError("");
  };

  return (
    <form className="flex flex-col w-full" method="POST" onSubmit={handleSubmit}>
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="w-full border rounded-[6px] text-[16px] placeholder-[#74747A] px-4 py-2 mb-4"
        onChange={handleEmailChange}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        className="w-full border rounded-[6px] text-[16px] placeholder-[#74747A] px-4 py-2 mb-8"
        onChange={handlePasswordChange}
      />
      <Button>Sign in</Button>
    </form>
  );
}
