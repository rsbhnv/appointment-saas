import { describe, expect, it } from "vitest";

import {
  RESERVED_BUSINESS_SLUGS,
  validateBusinessSlug,
} from "@/lib/tenant/reserved-slugs";

describe("validateBusinessSlug", () => {
  it("accepts a well-formed slug", () => {
    expect(validateBusinessSlug("my-business")).toEqual({
      ok: true,
      slug: "my-business",
    });
  });

  it("lowercases and trims input", () => {
    expect(validateBusinessSlug("  Hello-World  ")).toEqual({
      ok: true,
      slug: "hello-world",
    });
  });

  it("rejects too-short slugs", () => {
    expect(validateBusinessSlug("a")).toEqual({ ok: false, reason: "length" });
  });

  it("rejects malformed slugs", () => {
    expect(validateBusinessSlug("-leading")).toEqual({
      ok: false,
      reason: "format",
    });
    expect(validateBusinessSlug("trailing-")).toEqual({
      ok: false,
      reason: "format",
    });
    expect(validateBusinessSlug("HAS_underscore")).toEqual({
      ok: false,
      reason: "format",
    });
  });

  it("rejects consecutive hyphens", () => {
    expect(validateBusinessSlug("foo--bar")).toEqual({
      ok: false,
      reason: "consecutive-hyphen",
    });
  });

  it("rejects every reserved slug", () => {
    for (const reserved of RESERVED_BUSINESS_SLUGS) {
      expect(validateBusinessSlug(reserved)).toEqual({
        ok: false,
        reason: "reserved",
      });
    }
  });
});
