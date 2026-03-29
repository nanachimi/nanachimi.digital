import { describe, it, expect } from "vitest";
import {
  kontaktdatenSchema,
  projekttypSchema,
  beschreibungSchema,
  funktionenSchema,
  zeitrahmenSchema,
  budgetSchema,
  brandingSchema,
  MAX_CUSTOM_FEATURES,
  MAX_CUSTOM_FEATURE_LENGTH,
  CUSTOM_FEATURE_PREFIX,
} from "@/lib/onboarding-schema";

describe("onboarding-schema validation", () => {
  describe("kontaktdatenSchema", () => {
    it("accepts valid contact data", () => {
      const result = kontaktdatenSchema.safeParse({
        name: "Max Mustermann",
        email: "max@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects short name", () => {
      const result = kontaktdatenSchema.safeParse({
        name: "M",
        email: "max@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = kontaktdatenSchema.safeParse({
        name: "Max Mustermann",
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional firma and telefon", () => {
      const result = kontaktdatenSchema.safeParse({
        name: "Max Mustermann",
        email: "max@example.com",
        firma: "Test GmbH",
        telefon: "+49 123 456",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("projekttypSchema", () => {
    it("accepts valid project types", () => {
      for (const typ of ["web", "mobile", "desktop", "beides", "unsicher"]) {
        const result = projekttypSchema.safeParse({ projekttyp: typ });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid project type", () => {
      const result = projekttypSchema.safeParse({ projekttyp: "blockchain" });
      expect(result.success).toBe(false);
    });
  });

  describe("beschreibungSchema", () => {
    it("accepts description with 10+ chars", () => {
      const result = beschreibungSchema.safeParse({
        beschreibung: "Ein Online-Portal für Kunden",
      });
      expect(result.success).toBe(true);
    });

    it("rejects too short description", () => {
      const result = beschreibungSchema.safeParse({ beschreibung: "Kurz" });
      expect(result.success).toBe(false);
    });
  });

  describe("funktionenSchema", () => {
    it("accepts at least one feature", () => {
      const result = funktionenSchema.safeParse({
        funktionen: ["Suche & Filter"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty features array", () => {
      const result = funktionenSchema.safeParse({ funktionen: [] });
      expect(result.success).toBe(false);
    });
  });

  describe("zeitrahmenSchema", () => {
    it("accepts valid MVP + final timeline", () => {
      const result = zeitrahmenSchema.safeParse({
        zeitrahmenMvp: "48h",
        zeitrahmenFinal: "2-3monate",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid timeline", () => {
      const result = zeitrahmenSchema.safeParse({
        zeitrahmenMvp: "sofort",
        zeitrahmenFinal: "2-3monate",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("budgetSchema", () => {
    it("accepts all valid budget ranges", () => {
      for (const b of ["unter-399", "399-1000", "1000-5000", "5000-10000", "10000-plus", "unsicher"]) {
        expect(budgetSchema.safeParse({ budget: b }).success).toBe(true);
      }
    });
  });

  describe("brandingSchema", () => {
    it("accepts all optional fields", () => {
      expect(brandingSchema.safeParse({}).success).toBe(true);
    });

    it("accepts markenname and domain", () => {
      const result = brandingSchema.safeParse({
        markenname: "MeinProdukt",
        domain: "meinprodukt.de",
      });
      expect(result.success).toBe(true);
    });

    it("rejects too many fileIds", () => {
      const result = brandingSchema.safeParse({
        fileIds: ["1", "2", "3", "4", "5", "6"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("custom feature constants", () => {
    it("has correct limits", () => {
      expect(MAX_CUSTOM_FEATURES).toBe(10);
      expect(MAX_CUSTOM_FEATURE_LENGTH).toBe(35);
      expect(CUSTOM_FEATURE_PREFIX).toBe("custom:");
    });
  });
});
