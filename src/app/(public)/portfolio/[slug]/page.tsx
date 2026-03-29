import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { portfolioProjects } from "@/data/portfolio";
import { CTASection } from "@/components/sections/CTASection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return portfolioProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = portfolioProjects.find((p) => p.slug === slug);
  if (!project) return {};

  return {
    title: `${project.name} — ${project.tagline}`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = portfolioProjects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 md:py-28"
        style={{
          background: project.brandColorSecondary
            ? `linear-gradient(135deg, ${project.brandColor}, ${project.brandColorSecondary})`
            : `linear-gradient(135deg, ${project.brandColor}, ${project.brandColor}cc)`,
        }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />

        <div className="container relative mx-auto px-4 md:px-6">
          <Link
            href="/portfolio"
            className="inline-flex items-center text-sm text-white/70 hover:text-white transition-colors mb-8"
          >
            ← Alle Projekte
          </Link>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                  project.status === "beta"
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-white/15 text-white/80 border border-white/20"
                }`}
              >
                {project.statusLabel}
              </span>
              {project.liveUrl && (
                <Link
                  href={project.liveUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Live ansehen
                </Link>
              )}
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
              {project.name}
            </h1>
            <p className="mt-4 text-xl text-white/80 leading-relaxed md:text-2xl">
              {project.tagline}
            </p>
            <p className="mt-2 text-sm text-white/60">{project.role}</p>
          </div>
        </div>
      </section>

      {/* Screenshot / Image */}
      {project.imageUrl && (
        <section className="bg-[#111318] py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
              <Image
                src={project.imageUrl}
                alt={`${project.name} — Screenshot`}
                width={1200}
                height={675}
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      <section className="py-20 md:py-28 bg-[#0d0f13]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Über das Projekt
            </p>
            <p className="mt-4 text-xl leading-relaxed text-[#8B8F97] md:text-2xl">
              {project.description}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-[#111318]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Funktionsumfang
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            {project.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFC62C]/10">
                  <Check className="h-4 w-4 text-[#FFC62C]" />
                </div>
                <span className="text-base text-[#c8cad0]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 md:py-28 bg-[#0d0f13]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Technologie
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Tech-Stack
            </h2>
          </div>
          <div className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-3">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-[#c8cad0] hover:bg-white/[0.08] transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="Eigenes Projekt starten?"
        subtext="Teilen Sie uns Ihre Anforderungen mit und erhalten Sie in wenigen Minuten eine grobe Aufwandsschätzung."
      />
    </>
  );
}
