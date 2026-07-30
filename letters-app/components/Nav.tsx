"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Home", mobileIcon: "\u2302" },
  { href: "/write", label: "Write", mobileIcon: "\u2722" },
  { href: "/library", label: "Library", mobileIcon: "\uD83D\uDCDA" },
  { href: "/timeline", label: "Timeline", mobileIcon: "\u2248" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="beat">&#10084;</span> Letters to My Love
        </Link>
        <nav className="desktop-nav">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ThemeToggle />
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="btn btn-ghost" style={{ padding: "9px 18px", fontSize: "14px" }}>
              Sign in
            </Link>
          </SignedOut>
        </div>
      </header>

      <nav className="bottom-nav">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
            {l.mobileIcon}
          </Link>
        ))}
      </nav>
    </>
  );
}
