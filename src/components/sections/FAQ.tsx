import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqItems } from "@/data/faq";

export function FAQ() {
  return (
    <section className="relative py-24 md:py-32 bg-[#111318] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.04] blur-[120px]" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
            Häufige Fragen
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#8B8F97]">
            Antworten auf die wichtigsten Fragen zu unseren Leistungen und
            unserem Prozess.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-6 data-[state=open]:border-[#FFC62C]/30 data-[state=open]:bg-white/[0.05] transition-colors"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-white hover:no-underline py-5 hover:text-[#FFC62C]">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#8B8F97] leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
