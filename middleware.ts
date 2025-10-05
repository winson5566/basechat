import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

import { getStartPath } from "./lib/paths";
import { BASE_URL } from "./lib/server/settings";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const pathname = request.nextUrl.pathname;

  // If authenticated user lands on home, send them to the app start page
  if (sessionCookie && pathname === "/") {
    const newUrl = new URL(getStartPath(), BASE_URL);
    return Response.redirect(newUrl);
  }

  if (!sessionCookie) {
    if (
      pathname !== "/" &&
      pathname !== "/sign-in" &&
      pathname !== "/sign-up" &&
      pathname !== "/reset" &&
      pathname !== "/change-password" &&
      !isStaticAsset(pathname) &&
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
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:html|js|css|png|jpg|jpeg|gif|svg|webp|ico|mp4|webm|mov|txt|xml|json|woff|woff2|ttf|otf|eot|map)).*)",
  ],
};

function getUnauthenticatedRedirectPath(pathname: string) {
  if (pathname.startsWith("/o")) {
    const slug = pathname.split("/")[2];
    return `/check/${slug}`;
  } else {
    return "/sign-in";
  }
}

function isStaticAsset(pathname: string) {
  return /\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|webm|mov|txt|xml|json|woff|woff2|ttf|otf|eot|map)$/i.test(pathname);
}
