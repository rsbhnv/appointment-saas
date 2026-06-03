import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#7c3aed"/>
  <circle cx="256" cy="256" r="148" fill="#ffffff"/>
  <rect x="196" y="176" width="120" height="88" rx="20" fill="#7c3aed"/>
  <rect x="176" y="264" width="160" height="24" rx="12" fill="#7c3aed"/>
  <rect x="216" y="300" width="80" height="56" rx="12" fill="#7c3aed"/>
</svg>
`;

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

await fs.promises.mkdir(outDir, { recursive: true });

for (const { name, size } of sizes) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, name));
  console.log(`wrote ${name}`);
}
