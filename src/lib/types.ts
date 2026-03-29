export interface NavItem {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: NavItem[];
}

export interface PortfolioProject {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  brandColor: string;
  brandColorSecondary?: string;
  techStack: string[];
  features: string[];
  status: "live" | "beta" | "development";
  statusLabel: string;
  role: string;
  imageUrl?: string;
  liveUrl?: string;
  projectType?: "own" | "client";
}

export interface Service {
  slug: string;
  title: string;
  shortDescription: string;
  icon: string;
  features: string[];
  idealFor: string;
  process: { step: number; title: string; description: string }[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TrustSignal {
  label: string;
  description: string;
}

export interface EstimateResult {
  festpreis: number;
  aufwand: number; // Personentage
  assumptions: string[];
  exclusions: string[];
  riskLevel: "low" | "medium" | "high";
}
