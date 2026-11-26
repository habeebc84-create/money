// Recreates the PNG app icons from base64 text, so the repo stays text-only.
import { readFileSync, writeFileSync } from "node:fs";
const icons = JSON.parse(readFileSync(new URL("./icons.b64.json", import.meta.url), "utf8"));
for (const [name, b64] of Object.entries(icons)) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), Buffer.from(b64, "base64"));
}
