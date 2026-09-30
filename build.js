// Menggabungkan src/index.html beserta partial dan section-nya menjadi quiz1/index.html.
const fs = require("node:fs");
const path = require("node:path");

const SRC = path.join(__dirname, "src");
const ENTRY = path.join(SRC, "index.html");
const OUTPUT = path.join(__dirname, "quiz1", "index.html");

// Baris berbentuk `<!-- include: sections/food.html -->` diganti isi file tersebut,
// dengan indentasi baris include diterapkan ke setiap baris isinya.
const INCLUDE = /^([ \t]*)<!-- include: (\S+) -->[ \t]*$/gm;

function render(file, stack = []) {
  if (stack.includes(file)) {
    throw new Error(`Include berulang: ${[...stack, file].map((f) => path.relative(SRC, f)).join(" -> ")}`);
  }
  const source = fs.readFileSync(file, "utf8");

  return source.replace(INCLUDE, (_, indent, target) => {
    const includePath = path.join(SRC, target);
    if (!includePath.startsWith(SRC + path.sep)) {
      throw new Error(`Include di luar folder src: ${target}`);
    }
    const content = render(includePath, [...stack, file]).replace(/\n$/, "");
    return content
      .split("\n")
      .map((line) => (line ? indent + line : line))
      .join("\n");
  });
}

const html = render(ENTRY).replace(
  "<!DOCTYPE html>\n",
  "<!DOCTYPE html>\n<!-- Dibuat otomatis oleh build.js dari folder src/. Jangan edit file ini langsung. -->\n",
);

fs.writeFileSync(OUTPUT, html);
console.log(`Selesai: ${path.relative(__dirname, OUTPUT)}`);
