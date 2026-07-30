import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything requires sign-in except the landing page, the auth pages
// themselves, and public share links (/shared/[shareId]), which are
// intentionally readable without an account.
const isProtectedRoute = createRouteMatcher([
  "/write(.*)",
  "/library(.*)",
  "/timeline(.*)",
  "/letters/(.*)",
  "/api/letters(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|shared|sign-in|sign-up|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
