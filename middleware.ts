import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";

import auth from "@/auth";

import { BASE_URL } from "./lib/server/settings";

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get("cookie") || "", // Forward the cookies from the request
    },
  });

  if (!session) {
    const pathname = request.nextUrl.pathname;
    if (
      pathname !== "/sign-in" &&
      pathname !== "/sign-up" &&
      pathname !== "/reset" &&
      pathname !== "/change-password" &&
      !pathname.startsWith("/check") &&
      !pathname.startsWith("/api/auth/callback") &&
      !pathname.startsWith("/healthz")
    ) {
      const redirectPath = getUnauthenticatedRedirectPath(pathname);
      const newUrl = new URL(redirectPath, BASE_URL);
      if (pathname !== "/") {
        newUrl.searchParams.set("redirectTo", request.nextUrl.toString());
      }
      return Response.redirect(newUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

function getUnauthenticatedRedirectPath(pathname: string) {
  if (pathname.startsWith("/o")) {
    const slug = pathname.split("/")[2];
    return `/check/${slug}`;
  } else {
    return "/sign-in";
  }
}
