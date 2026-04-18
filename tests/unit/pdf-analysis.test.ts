import { describe, it, expect } from "vitest";
import {
  REQUIRED_ONBOARDING_FIELDS,
  groupMissingFields,
} from "@/lib/pdf-analysis";

describe("pdf-analysis", () => {
  describe("REQUIRED_ONBOARDING_FIELDS", () => {
    it("lists all required fields for submission", () => {
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("projekttyp");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("beschreibung");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("funktionen");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("rollenAnzahl");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("designLevel");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("zeitrahmenMvp");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("zeitrahmenFinal");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("budget");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("betriebUndWartung");
      expect(REQUIRED_ONBOARDING_FIELDS).toContain("monetarisierung");
      expect(REQUIRED_ONBOARDING_FIELDS).toHaveLength(10);
    });

    it("does not include contact fields", () => {
      expect(REQUIRED_ONBOARDING_FIELDS).not.toContain("name");
      expect(REQUIRED_ONBOARDING_FIELDS).not.toContain("email");
      expect(REQUIRED_ONBOARDING_FIELDS).not.toContain("naechsterSchritt");
    });
  });

  describe("groupMissingFields", () => {
    it("returns fields as-is when no grouping needed", () => {
      const result = groupMissingFields(["projekttyp", "budget"]);
      expect(result).toContain("projekttyp");
      expect(result).toContain("budget");
      expect(result).toHaveLength(2);
    });

    it("groups zeitrahmenMvp and zeitrahmenFinal into one entry", () => {
      const result = groupMissingFields([
        "projekttyp",
        "zeitrahmenMvp",
        "zeitrahmenFinal",
        "budget",
      ]);
      expect(result).toContain("zeitrahmen");
      expect(result).not.toContain("zeitrahmenMvp");
      expect(result).not.toContain("zeitrahmenFinal");
      expect(result).toHaveLength(3); // projekttyp, zeitrahmen, budget
    });

    it("groups into zeitrahmen when only zeitrahmenMvp is missing", () => {
      const result = groupMissingFields(["zeitrahmenMvp"]);
      expect(result).toContain("zeitrahmen");
      expect(result).toHaveLength(1);
    });

    it("groups into zeitrahmen when only zeitrahmenFinal is missing", () => {
      const result = groupMissingFields(["zeitrahmenFinal"]);
      expect(result).toContain("zeitrahmen");
      expect(result).toHaveLength(1);
    });

    it("returns empty array for no missing fields", () => {
      const result = groupMissingFields([]);
      expect(result).toHaveLength(0);
    });

    it("handles all required fields missing", () => {
      const result = groupMissingFields([...REQUIRED_ONBOARDING_FIELDS]);
      // zeitrahmenMvp + zeitrahmenFinal → zeitrahmen (10 → 9)
      expect(result).toHaveLength(9);
      expect(result).toContain("zeitrahmen");
    });

    it("preserves non-required fields", () => {
      const result = groupMissingFields(["zielgruppe", "markenname"]);
      expect(result).toContain("zielgruppe");
      expect(result).toContain("markenname");
      expect(result).toHaveLength(2);
    });
  });
});
