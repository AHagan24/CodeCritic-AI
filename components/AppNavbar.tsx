"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, LayoutDashboard, Settings } from "lucide-react";
import codeCriticLogo from "@/assets/CodeCriticLogo.png";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (pathname: string) => pathname === "/",
  },
  {
    href: "/history",
    label: "History",
    icon: Clock3,
    match: (pathname: string) =>
      pathname === "/history" || pathname.startsWith("/reviews/"),
  },
  {
    href: "#",
    label: "Settings",
    icon: Settings,
    match: () => false,
  },
];

function getNavItemClassName(isActive: boolean) {
  return isActive
    ? "bg-white text-black shadow-[0_12px_28px_rgba(255,255,255,0.08)]"
    : "text-zinc-400 hover:bg-white/5 hover:text-white";
}

export default function AppNavbar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(9,9,11,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-2 shadow-inner shadow-white/[0.04]">
              <Image
                src={codeCriticLogo}
                alt="CodeCritic AI logo"
                className="h-auto max-h-7 w-auto object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-white">
                CodeCritic AI
              </p>
              <p className="truncate text-sm text-zinc-500">
                Premium AI code review workspace
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <nav className="flex flex-wrap items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-1.5">
              {navItems.map((item) => {
                const isActive = item.match(pathname);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${getNavItemClassName(
                      isActive,
                    )}`}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-300 md:block">
                Personal Workspace
              </div>
              <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,#f4f4f5,#71717a)] text-sm font-semibold text-black">
                AC
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
