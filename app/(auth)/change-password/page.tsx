import Link from "next/link";

import { Title } from "../common";

import ChangePassword from "./change-password";

interface Props {
  searchParams: Promise<{ token: string }>;
}

export default async function ChangePasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <>
      <Title>Enter new password:</Title>
      <ChangePassword token={token} />
      <Link href="/reset" className="mt-6 text-[16px] text-[#74747A] hover:underline">
        Back to reset
      </Link>
    </>
  );
}
