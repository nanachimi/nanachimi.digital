import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PortfolioProject } from "@/lib/types";

interface PortfolioCardProps {
  project: PortfolioProject;
}

export function PortfolioCard({ project }: PortfolioCardProps) {
  return (
    <Link
      href={`/portfolio/${project.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-white/[0.15] hover:-translate-y-1"
    >
      {/* Image / Brand color header */}
      <div
        className="relative h-48 overflow-hidden"
        style={{
          background: project.brandColorSecondary
            ? `linear-gradient(135deg, ${project.brandColor}, ${project.brandColorSecondary})`
            : `linear-gradient(135deg, ${project.brandColor}, ${project.brandColor}dd)`,
        }}
      >
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={`${project.name} Screenshot`}
            fill
            className="object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
              project.status === "beta"
                ? "bg-green-400/20 text-green-300 border border-green-400/30"
                : "bg-white/10 text-white/80 border border-white/20"
            }`}
          >
            {project.statusLabel}
          </span>
        </div>

        {/* Project name overlay */}
        <div className="absolute bottom-4 left-5">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">{project.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <p className="text-sm text-[#8B8F97] leading-relaxed">
          {project.tagline}
        </p>

        {/* Tech stack */}
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

        {/* Link */}
        <div className="flex items-center text-sm font-semibold text-[#FFC62C] transition-colors">
          Projekt ansehen
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
