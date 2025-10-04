import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

import { BASE_URL } from "./lib/server/settings";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const pathname = request.nextUrl.pathname;
    if (
      pathname !== "/sign-in" &&
      pathname !== "/sign-up" &&
      pathname !== "/reset" &&
      pathname !== "/change-password" &&
      !pathname.startsWith("/check") &&
      !pathname.startsWith("/api/auth/callback") &&
      !pathname.startsWith("/api/admin") &&
      //extensions
      !pathname.startsWith("/api/extend_chatbot") &&
      !pathname.startsWith("/chatbot/") &&
      !pathname.startsWith("/healthz") &&
      !pathname.startsWith("/images")
    ) {
      const redirectPath = getUnauthenticatedRedirectPath(pathname);
      const newUrl = new URL(redirectPath, BASE_URL);
      if (pathname !== "/") {
        const redirectTo = new URL(pathname, BASE_URL);
        redirectTo.search = request.nextUrl.search;
        newUrl.searchParams.set("redirectTo", redirectTo.toString());
      }
      return Response.redirect(newUrl);
    }
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  //extensions
  // matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.html|.*\\.js|.*\\.css).*)"],
};

function getUnauthenticatedRedirectPath(pathname: string) {
  if (pathname.startsWith("/o")) {
    const slug = pathname.split("/")[2];
    return `/check/${slug}`;
  } else {
    return "/sign-in";
  }
}
