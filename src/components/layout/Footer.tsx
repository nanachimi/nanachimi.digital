import Link from "next/link";
import { FOOTER_SECTIONS, SITE_CONFIG } from "@/lib/constants";
import { LogoIcon } from "@/components/layout/LogoIcon";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon className="h-7 w-7" />
              <span className="text-sm font-semibold tracking-tight text-foreground">
                nanachimi<span className="text-[#FFC62C] font-bold">.digital</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Digitale Lösungen, die schnell live gehen.
              <br />
              Von der Idee bis zum laufenden Betrieb.
            </p>
            <p className="text-sm text-muted-foreground">
              {SITE_CONFIG.location}
            </p>
          </div>

          {/* Link Sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-6 space-y-2">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. Alle Rechte
            vorbehalten.
          </p>
          <div className="flex justify-center">
            <CookieSettingsLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
