"use client";
import Image from "next/image";

import { signIn } from "@/lib/auth-client";

import GoogleMarkSVG from "../../../public/google-mark.svg";

interface Props {
  redirectTo?: string;
}

export default function GoogleSignIn({ redirectTo }: Props) {
  async function handleClick() {
    const { data, error } = await signIn.social({
      provider: "google",
      callbackURL: redirectTo,
    });
  }

  return (
    <button
      type="submit"
      className="mb-8 w-full flex bg-[#F2F2F2] py-2.5 px-3 rounded-[48px] w-full justify-center items-center"
      onClick={handleClick}
    >
      <Image src={GoogleMarkSVG} alt="Continue with Google" />
      <div className={`ml-2.5 text-base drop-shadow-md`}>Continue with Google</div>
    </button>
  );
}
