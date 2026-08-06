// Removes a flat/checkerboard background from AI-generated PNGs that claim
// transparency but ship as opaque RGB (common with ChatGPT image exports).
// Flood-fills light, low-saturation pixels connected to the image border,
// so it won't eat into the penguin's white belly (not border-connected).
// Usage: node scripts/removeBackground.js <input.png> <output.png>
// Requires: npm install --no-save sharp
const sharp = require("sharp");
const path = require("path");

async function removeBackground(inputPath, outputPath) {
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const isBgLike = (r, g, b) => {
    // Checkerboard preview squares are near-white / very light gray, low saturation.
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    return max > 225 && sat < 0.08;
  };

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0;
  let qTail = 0;

  const idxOf = (x, y) => y * width + x;
  const pushIfBg = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = idxOf(x, y);
    if (visited[i]) return;
    const p = i * channels;
    if (!isBgLike(data[p], data[p + 1], data[p + 2])) return;
    visited[i] = 1;
    queue[qTail++] = i;
  };

  // Seed from every border pixel.
  for (let x = 0; x < width; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIfBg(0, y);
    pushIfBg(width - 1, y);
  }

  while (qHead < qTail) {
    const i = queue[qHead++];
    const x = i % width;
    const y = (i / width) | 0;
    pushIfBg(x + 1, y);
    pushIfBg(x - 1, y);
    pushIfBg(x, y + 1);
    pushIfBg(x, y - 1);
  }

  let cleared = 0;
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      data[i * channels + 3] = 0;
      cleared++;
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log(`Done: ${cleared}/${width * height} px cleared (${((cleared / (width * height)) * 100).toFixed(1)}%) -> ${outputPath}`);
}

const [, , input, output] = process.argv;
removeBackground(path.resolve(input), path.resolve(output)).catch((err) => {
  console.error(err);
  process.exit(1);
});
