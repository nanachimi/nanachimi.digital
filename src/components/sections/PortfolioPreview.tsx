import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { featuredProjects } from "@/data/portfolio";

export function PortfolioPreview() {
  return (
    <section className="py-24 md:py-32 bg-[#111318] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.03] blur-[150px]" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Portfolio
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
              Eigene Produkte
            </h2>
            <p className="mt-4 max-w-xl text-lg text-[#8B8F97]">
              5 Plattformen in aktiver Entwicklung — vom Konzept bis zum Betrieb
              in meiner Verantwortung.
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="mt-6 md:mt-0 text-[#8B8F97] hover:text-[#FFC62C] hover:bg-white/5 rounded-xl"
          >
            <Link href="/portfolio">
              Alle Projekte
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <Link
              key={project.slug}
              href={`/portfolio/${project.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-[#FFC62C]/20 hover:bg-white/[0.05] hover:-translate-y-1"
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

                {/* Status badge */}
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

                {/* Name overlay */}
                <div className="absolute bottom-3 left-4">
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                    {project.name}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <p className="text-sm text-[#8B8F97] leading-relaxed">
                  {project.tagline}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-0.5 text-xs text-[#8B8F97]"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 4 && (
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-0.5 text-xs text-[#8B8F97]">
                      +{project.techStack.length - 4}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm font-bold text-[#FFC62C] transition-colors">
                  Projekt ansehen
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
