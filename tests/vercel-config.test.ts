import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Header = { key: string; value: string };
type HeaderRule = { source: string; headers: Header[] };
type VercelConfig = {
  framework?: string;
  outputDirectory?: string;
  headers?: HeaderRule[];
};

const config: VercelConfig = JSON.parse(
  readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
);
const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

describe("Vercel deployment config", () => {
  it("lets the Next.js preset find its build manifest and publish the static export", () => {
    expect(config.framework).toBe("nextjs");
    expect(config.outputDirectory).toBeUndefined();
    expect(nextConfig).toContain('output: "export"');
  });

  it("keeps the security headers and service-worker cache rule", () => {
    const keys = config.headers?.flatMap((rule) => rule.headers.map((header) => header.key)) ?? [];
    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "X-Frame-Options",
        "Cross-Origin-Opener-Policy",
        "Cache-Control",
      ]),
    );
    expect(config.headers?.some((rule) => rule.source === "/sw.js")).toBe(true);
  });
});
