import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative min-h-[70vh] flex items-center bg-[#111318]">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.04] blur-[120px]" />
      </div>
      <div className="container relative mx-auto px-4 text-center md:px-6">
        <p className="text-8xl font-black text-[#FFC62C] md:text-9xl">404</p>
        <h1 className="mt-4 text-2xl font-bold text-white md:text-3xl">
          Seite nicht gefunden
        </h1>
        <p className="mt-4 text-[#8B8F97] max-w-md mx-auto">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <Button
          asChild
          className="mt-8 bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold"
        >
          <Link href="/">
            Zur Startseite
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
