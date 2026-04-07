import Link from "next/link";

const footerLinks = [
  { href: "/history", label: "History" },
  { href: "https://docs.codecritic.ai", label: "Docs", external: true },
  { href: "https://codecritic.ai/privacy", label: "Privacy", external: true },
  { href: "mailto:hello@codecritic.ai", label: "Contact", external: true },
  { href: "https://github.com/codecritic-ai", label: "GitHub", external: true },
];

export default function AppFooter() {
  return (
    <footer className="border-t border-white/10 bg-[rgba(9,9,11,0.72)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">CodeCritic AI</p>
          <p className="mt-1 text-sm text-zinc-500">
            Premium AI code review workspace
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500"
        >
          {footerLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-zinc-200"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-zinc-200"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
