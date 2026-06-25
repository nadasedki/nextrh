import fs from "fs";
import path from "path";
import sharp from "sharp";
import { convert } from "pdf-poppler";

// -------------------- UTILS --------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cleanJSON(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

// -------------------- PDF → IMAGES --------------------

async function pdfToImages(pdfPath: string) {
  const outputDir = path.join(__dirname, "tmp_pages");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  await convert(pdfPath, {
    format: "png",
    out_dir: outputDir,
    out_prefix: "page",
    page: null,
    dpi: 150, // 🔥 optimized (faster than 300)
  });

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".png"))
    .sort();

  return files.map((file) => path.join(outputDir, file));
}

// -------------------- IMAGE OPTIMIZATION --------------------

async function imageToBase64(imagePath: string) {
  const buffer = fs.readFileSync(imagePath);

  const optimized = await sharp(buffer)
    .resize({ width: 1000 }) // 🔥 important for speed
    .png({ quality: 80 })
    .toBuffer();

  return optimized.toString("base64");
}

// -------------------- VISION CALL --------------------

async function callVisionModel(imageBase64: string) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen2.5vl:3b",
      stream: false,
      messages: [
        {
          role: "user",
          content: `
Extract CV information from this image.

Return ONLY valid JSON.

Do not use markdown. Do not wrap in code blocks.
Do not add explanations.

Schema:
{
  "full_name": string | null,
  "job_title": string | null,
  "contact": {
    "phone": string | null,
    "fax": string | null,
    "email": string | null,
    "address": string | null
  },
  "experience": [
    {
      "period": string | null,
      "company": string | null,
      "position": string | null
    }
  ],
  "education": [
    {
      "year": string | null,
      "institution": string | null,
      "degree": string | null
    }
  ],
  "projects": [
    {
      "year": string | null,
      "client": string | null,
      "description": string | null
    }
  ]
}
`,
          images: [imageBase64],
        },
      ],
    }),
  });

  const data = await res.json();
  return data.message.content;
}

// -------------------- MAIN PIPELINE --------------------

async function main() {
  const pdfPath =
    "C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\test\\data\\cvs\\CV amal khalfaoui 2024.pdf";

  console.log("📄 Converting PDF to images...");

  const pages = await pdfToImages(pdfPath);

  console.log(`📑 Found ${pages.length} pages`);

  const results: any[] = [];

  for (let i = 0; i < pages.length; i++) {
    console.log(`🤖 Processing page ${i + 1}/${pages.length}`);

    try {
      const base64 = await imageToBase64(pages[i]);

      const result = await callVisionModel(base64);

      const clean = cleanJSON(result);

      try {
        results.push(JSON.parse(clean));
      } catch (e) {
        console.log("⚠️ Invalid JSON on page", i + 1);
        console.log(clean);
      }

      // 🔥 IMPORTANT: prevent Ollama overload
      await sleep(1500);
    } catch (err) {
      console.log(`❌ Error on page ${i + 1}:`, err);
    }
  }

  console.log("\n========== FINAL RESULT ==========\n");
  console.dir(results, { depth: null });
}

main().catch(console.error);