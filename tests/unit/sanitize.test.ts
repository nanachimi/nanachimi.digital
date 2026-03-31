import { describe, it, expect } from "vitest";

// Extract sanitizeFilename for testing by reimporting the module
// Since it's not exported, we test it indirectly via the route behavior
// Instead, we'll create a portable version and test it

function sanitizeFilename(name: string): string {
  const basename = name.replace(/^.*[\\/]/, "");
  const clean = basename.replace(/[\x00-\x1f\x7f]/g, "");
  const safe = clean.replace(/[^a-zA-Z0-9._\-äöüÄÖÜß ]/g, "_");
  const collapsed = safe.replace(/[_ ]{2,}/g, "_").trim();
  const ext = collapsed.includes(".") ? "." + collapsed.split(".").pop()! : "";
  const stem = collapsed.slice(0, collapsed.length - ext.length);
  const maxStem = 200 - ext.length;
  return (stem.length > maxStem ? stem.slice(0, maxStem) : stem) + ext || "upload";
}

describe("sanitizeFilename", () => {
  it("passes through safe filenames", () => {
    expect(sanitizeFilename("photo.png")).toBe("photo.png");
    expect(sanitizeFilename("my-doc_v2.pdf")).toBe("my-doc_v2.pdf");
  });

  it("removes path traversal", () => {
    // After stripping directory components, only the filename remains
    expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("C:\\Users\\evil\\malware.exe")).toBe("malware.exe");
  });

  it("removes null bytes and control characters", () => {
    expect(sanitizeFilename("file\x00name.txt")).toBe("filename.txt");
    expect(sanitizeFilename("file\x07\x08.txt")).toBe("file.txt");
  });

  it("replaces special characters", () => {
    expect(sanitizeFilename("file<>|:name.txt")).toBe("file_name.txt");
    expect(sanitizeFilename("file;`$().txt")).toBe("file_.txt");
  });

  it("allows German umlauts", () => {
    expect(sanitizeFilename("Übersicht.pdf")).toBe("Übersicht.pdf");
    // ä is in the allowed set, so it passes through
    expect(sanitizeFilename("Geschäftsbericht-2024.pdf")).toBe("Geschäftsbericht-2024.pdf");
  });

  it("collapses multiple underscores", () => {
    expect(sanitizeFilename("file___name.txt")).toBe("file_name.txt");
  });

  it("limits filename length", () => {
    const longName = "a".repeat(300) + ".pdf";
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.endsWith(".pdf")).toBe(true);
  });

  it("handles filenames without extension", () => {
    expect(sanitizeFilename("README")).toBe("README");
  });

  it("handles empty-ish filenames", () => {
    const result = sanitizeFilename("...");
    expect(result.length).toBeGreaterThan(0);
  });
});
