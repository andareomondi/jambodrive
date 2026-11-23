import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/email/resend";

describe("escapeHtml", () => {
  it("escapes characters that could inject markup into an email", () => {
    expect(escapeHtml(`<img src=x onerror="alert('hi')">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;hi&#39;)&quot;&gt;",
    );
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });
});
