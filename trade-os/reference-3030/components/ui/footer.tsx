import Link from "@trade-os/reference-3030/compat/link";

import { cx } from "./utils";

export type FooterLink = {
  href: string;
  label: string;
};

export type FooterProps = {
  className?: string;
  copyright?: string;
  links?: FooterLink[];
};

// 정본 DEFAULT는 6개(buildLegalUrl 경유 /legal?tab=privacy·terms·location + /pricing 포함).
// 이 repo는 /legal·/pricing 라우트 미보유라 정적 4개 유지 — 라우트 도입 시 정본 세트로 수렴.
// (parity 보고서 Lap2 S1 / RECONCILE 참조)
const DEFAULT_LINKS: FooterLink[] = [
  { href: "/", label: "Home" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

const DEFAULT_COPYRIGHT = "\u24D2 2026 ECOYA SNAP";

export function Footer({
  className,
  copyright = DEFAULT_COPYRIGHT,
  links = DEFAULT_LINKS,
}: FooterProps) {
  return (
    <footer
      className={cx(
        "flex w-full items-center justify-center bg-ecoya-gray-12 px-2.5 py-6",
        className,
      )}
      data-ui="footer"
    >
      <div className="flex items-center gap-4" data-ui="footer-link-list">
        {links.map((link) => (
          <Link
            className="rounded-sm text-button-13 font-medium text-ecoya-gray-7 no-underline hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
        <span className="text-button-13 font-medium text-ecoya-gray-7">
          {copyright}
        </span>
      </div>
    </footer>
  );
}
