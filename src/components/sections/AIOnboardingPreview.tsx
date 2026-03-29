"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Sparkles, Send } from "lucide-react";

const chatSequence = [
  {
    type: "bot" as const,
    text: "Hallo! 👋 Ich bin der nanachimi.digital Assistent. Erzählen Sie mir von Ihrem Projekt — ich gebe Ihnen in wenigen Minuten eine erste Einschätzung.",
    delay: 0,
  },
  {
    type: "user" as const,
    text: "Ich brauche eine Plattform für Umzugshelfer-Vermittlung mit Buchungssystem.",
    delay: 2000,
  },
  {
    type: "bot" as const,
    text: "Spannend! Ein zweiseitiger Marktplatz mit Buchungsfunktion. Dafür brauchen wir:",
    delay: 3500,
  },
  {
    type: "bot" as const,
    text: "✓ Anmeldung & Benutzerkonten\n✓ Suche & Filter\n✓ Online-Buchungssystem\n✓ Bewertungssystem\n✓ Online bezahlen",
    delay: 5000,
  },
  {
    type: "bot" as const,
    text: "📊 Geschätzt: 2.970 – 5.990 EUR\nBasierend auf Umfang und Komplexität.\n\nSoll ich den Scope detaillierter aufnehmen?",
    delay: 7000,
  },
];

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-4 py-3">
      <div className="h-2 w-2 rounded-full bg-[#FFC62C]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="h-2 w-2 rounded-full bg-[#FFC62C]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="h-2 w-2 rounded-full bg-[#FFC62C]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export function AIOnboardingPreview() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Start animation when section is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const timers: NodeJS.Timeout[] = [];

    chatSequence.forEach((msg, i) => {
      // Show typing before each message
      const typingTimer = setTimeout(() => {
        setIsTyping(true);
      }, msg.delay);
      timers.push(typingTimer);

      // Show message after typing
      const msgTimer = setTimeout(() => {
        setVisibleMessages((prev) => prev + 1);
        setIsTyping(i < chatSequence.length - 1);
      }, msg.delay + (msg.type === "bot" ? 800 : 200));
      timers.push(msgTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, [hasStarted]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages, isTyping]);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-[#0d0f14] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-[#FFC62C]/[0.03] blur-[200px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,198,44,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,198,44,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC62C]/20 bg-[#FFC62C]/[0.08] px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-[#FFC62C]" />
              <span className="text-sm font-medium text-[#FFC62C]">
                In 3 Minuten zur Einschätzung
              </span>
            </div>
            <h2 id="onboarding-preview" className="text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl !leading-[1.1]">
              Beschreiben Sie Ihr Vorhaben.
              <br />
              <span className="text-[#FFC62C]">Wir kümmern uns um den Rest.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg text-[#8B8F97] leading-relaxed">
              Kein Fachwissen nötig. Beschreiben Sie einfach,
              was Sie brauchen — wir liefern Ihnen eine erste
              Einschätzung in wenigen Minuten.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Vorhaben beschreiben — kein Fachwissen nötig",
                "Sofort einen ersten Kostenrahmen sehen",
                "Entscheiden, wie es weitergeht",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFC62C]/10 text-[#FFC62C] text-xs font-bold">
                    {i + 1}
                  </div>
                  <span className="text-[#c8cad0]">{item}</span>
                </div>
              ))}
            </div>

            <Button
              asChild
              size="lg"
              className="mt-10 h-14 px-8 text-base font-bold bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl shadow-[0_0_30px_rgba(255,198,44,0.3)] hover:shadow-[0_0_40px_rgba(255,198,44,0.4)] transition-all"
            >
              <Link href="/onboarding">
                Jetzt starten — kostenlos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Right: Chat simulation */}
          <div className="relative">
            {/* Glow behind card */}
            <div className="absolute -inset-4 bg-[#FFC62C]/[0.04] rounded-3xl blur-xl" />

            <div className="relative rounded-2xl border border-white/[0.08] bg-[#1a1d24]/80 backdrop-blur-md shadow-2xl overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFC62C]/10">
                  <Bot className="h-5 w-5 text-[#FFC62C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    nanachimi.digital Assistent
                  </p>
                  <p className="text-xs text-[#6a6e76]">Online • Antwortet sofort</p>
                </div>
                <div className="ml-auto flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>
              </div>

              {/* Chat messages */}
              <div
                ref={chatRef}
                className="h-[380px] overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide"
              >
                {chatSequence.slice(0, visibleMessages).map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.type === "user"
                          ? "bg-[#FFC62C] text-[#111318] rounded-br-md"
                          : "bg-white/[0.06] text-[#c8cad0] border border-white/[0.06] rounded-bl-md"
                      }`}
                    >
                      <span className="whitespace-pre-line">{msg.text}</span>
                    </div>
                  </div>
                ))}

                {isTyping && visibleMessages < chatSequence.length && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.06] border border-white/[0.06] rounded-2xl rounded-bl-md">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
              </div>

              {/* Predefined suggestions */}
              <div className="border-t border-white/[0.06] px-6 py-3">
                <p className="text-xs text-[#5a5e66] mb-2">Häufige Projektideen:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Ich brauche eine Buchungsplattform",
                    "Erste Version in 48 Stunden",
                    "Online-Portal aufbauen",
                    "Abläufe automatisieren",
                  ].map((suggestion) => (
                    <Link
                      key={suggestion}
                      href="/onboarding"
                      className="inline-flex items-center rounded-full border border-[#FFC62C]/20 bg-[#FFC62C]/[0.06] px-3 py-1.5 text-xs font-medium text-[#FFC62C] hover:bg-[#FFC62C]/[0.12] hover:border-[#FFC62C]/40 transition-all cursor-pointer"
                    >
                      {suggestion}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Chat input (decorative) */}
              <div className="border-t border-white/[0.06] px-6 py-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                  <span className="flex-1 text-sm text-[#5a5e66]">
                    Oder beschreiben Sie Ihr Projekt...
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC62C] text-[#111318]">
                    <Send className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
