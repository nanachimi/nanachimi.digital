import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { portfolioProjects } from "@/data/portfolio";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Web- & Mobile-Apps — Portfolio",
  description:
    "Eigene Produkte in aktiver Entwicklung — vom Konzept über Architektur bis zum Betrieb. Cerebra, Kumlix, Makkala, Movovia und Credilis.",
};

export default function PortfolioPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#111318] py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[#FFC62C]/[0.06] blur-[120px]" />
        </div>
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Portfolio
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl !leading-[1.05]">
              Eigene Produkte.
              <br />
              <span className="text-[#FFC62C]">Echte Verantwortung.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8B8F97] md:text-xl">
              Vom Konzept über Architektur bis zum Betrieb — jedes Produkt in
              meiner vollen Verantwortung. Kein Kundenprojekt, sondern eigene
              Plattformen.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 md:py-28 bg-[#0d0f13]">
        <div className="container mx-auto px-4 md:px-6">
          {/* Featured large cards (first 2) */}
          <div className="grid gap-8 md:grid-cols-2 mb-8">
            {portfolioProjects.slice(0, 2).map((project) => (
              <Link
                key={project.slug}
                href={`/portfolio/${project.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.15] hover:-translate-y-1"
              >
                {/* Image area */}
                <div className="relative h-64 md:h-72 overflow-hidden">
                  {project.imageUrl ? (
                    <Image
                      src={project.imageUrl}
                      alt={`${project.name} — Screenshot`}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: project.brandColorSecondary
                          ? `linear-gradient(135deg, ${project.brandColor}, ${project.brandColorSecondary})`
                          : `linear-gradient(135deg, ${project.brandColor}, ${project.brandColor}dd)`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/40 to-transparent" />

                  {/* Status badge */}
                  <div className="absolute top-4 right-4">
                    <div className="flex gap-2">
                      {project.projectType === "client" && (
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md bg-blue-400/20 text-blue-300 border border-blue-400/30">
                          Kundenprojekt
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${
                          project.status === "beta"
                            ? "bg-green-400/20 text-green-300 border border-green-400/30"
                            : "bg-white/10 text-white/80 border border-white/20"
                        }`}
                      >
                        {project.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Name overlay */}
                  <div className="absolute bottom-4 left-5">
                    <h3 className="text-3xl font-black text-white drop-shadow-lg">
                      {project.name}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-[#8B8F97] leading-relaxed">
                    {project.tagline}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-0.5 text-xs text-[#8B8F97]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-sm font-bold text-[#FFC62C] transition-colors">
                    Projekt ansehen
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Remaining projects (3 columns) */}
          <div className="grid gap-8 md:grid-cols-3">
            {portfolioProjects.slice(2).map((project) => (
              <Link
                key={project.slug}
                href={`/portfolio/${project.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.15] hover:-translate-y-1"
              >
                {/* Image area */}
                <div className="relative h-48 overflow-hidden">
                  {project.imageUrl ? (
                    <Image
                      src={project.imageUrl}
                      alt={`${project.name} — Screenshot`}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: project.brandColorSecondary
                          ? `linear-gradient(135deg, ${project.brandColor}, ${project.brandColorSecondary})`
                          : `linear-gradient(135deg, ${project.brandColor}, ${project.brandColor}dd)`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/30 to-transparent" />

                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md ${
                        project.status === "beta"
                          ? "bg-green-400/20 text-green-300 border border-green-400/30"
                          : "bg-white/10 text-white/80 border border-white/20"
                      }`}
                    >
                      {project.statusLabel}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-2xl font-black text-white drop-shadow-lg">
                      {project.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-sm text-[#8B8F97] leading-relaxed">
                    {project.tagline}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-0.5 text-xs text-[#8B8F97]"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-0.5 text-xs text-[#8B8F97]">
                        +{project.techStack.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm font-bold text-[#FFC62C]">
                    Projekt ansehen
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
