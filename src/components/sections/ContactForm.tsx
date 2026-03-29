"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle } from "lucide-react";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      company: formData.get("company") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsSubmitted(true);
      }
    } catch {
      // Silently handle for now
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="mt-8 flex flex-col items-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-xl font-bold">Nachricht gesendet!</h3>
        <p className="mt-2 text-muted-foreground">
          Vielen Dank. Ich melde mich innerhalb von 24 Stunden bei Ihnen.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Max Mustermann"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="max@beispiel.de"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Firma (optional)</Label>
        <Input
          id="company"
          name="company"
          placeholder="Ihre Firma"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Nachricht *</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Beschreiben Sie kurz Ihr Anliegen..."
          rows={5}
          required
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full h-14 text-base font-bold bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl shadow-[0_0_20px_rgba(255,198,44,0.2)]"
      >
        {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );
}
