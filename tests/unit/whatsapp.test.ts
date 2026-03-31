import { describe, it, expect } from "vitest";
import { normalizePhoneNumber } from "@/lib/whatsapp";
import {
  buildCustomerAngebotTemplate,
  buildCustomerCallTemplate,
  buildInternalTemplate,
  TEMPLATES,
} from "@/lib/whatsapp-templates";
import type { Submission } from "@/lib/submissions";

describe("normalizePhoneNumber", () => {
  it("normalizes a valid German mobile number", () => {
    expect(normalizePhoneNumber("+49 176 12345678")).toBe("+4917612345678");
  });

  it("normalizes without country code (default DE)", () => {
    expect(normalizePhoneNumber("0176 12345678")).toBe("+4917612345678");
  });

  it("normalizes Austrian number", () => {
    expect(normalizePhoneNumber("+43 664 1234567")).toBe("+436641234567");
  });

  it("normalizes Swiss number", () => {
    expect(normalizePhoneNumber("+41 79 123 45 67")).toBe("+41791234567");
  });

  it("returns null for empty string", () => {
    expect(normalizePhoneNumber("")).toBeNull();
  });

  it("returns null for too-short input", () => {
    expect(normalizePhoneNumber("123")).toBeNull();
  });

  it("returns null for invalid number", () => {
    expect(normalizePhoneNumber("not-a-phone")).toBeNull();
  });

  it("returns null for partial number", () => {
    expect(normalizePhoneNumber("+49 123")).toBeNull();
  });
});

describe("whatsapp-templates", () => {
  it("builds customer Angebot template", () => {
    const tpl = buildCustomerAngebotTemplate("Max", "500–1000 €");
    expect(tpl.templateName).toBe(TEMPLATES.CUSTOMER_ANGEBOT);
    expect(tpl.language).toBe("de");
    expect(tpl.variables).toEqual(["Max", "500–1000 €"]);
  });

  it("builds customer Call template", () => {
    const tpl = buildCustomerCallTemplate("Max");
    expect(tpl.templateName).toBe(TEMPLATES.CUSTOMER_CALL);
    expect(tpl.language).toBe("de");
    expect(tpl.variables).toEqual(["Max"]);
  });

  it("builds internal template", () => {
    const submission = {
      name: "Max Mustermann",
      projekttyp: "web",
      naechsterSchritt: "angebot",
    } as Submission;
    const tpl = buildInternalTemplate(submission);
    expect(tpl.templateName).toBe(TEMPLATES.INTERNAL);
    expect(tpl.variables).toEqual(["Max Mustermann", "web", "angebot"]);
  });
});
