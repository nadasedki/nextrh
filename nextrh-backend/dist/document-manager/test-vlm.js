"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const pdf_poppler_1 = require("pdf-poppler");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function cleanJSON(text) {
    return text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
}
async function pdfToImages(pdfPath) {
    const outputDir = path_1.default.join(__dirname, "tmp_pages");
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir);
    }
    await (0, pdf_poppler_1.convert)(pdfPath, {
        format: "png",
        out_dir: outputDir,
        out_prefix: "page",
        page: null,
        dpi: 150,
    });
    const files = fs_1.default
        .readdirSync(outputDir)
        .filter((f) => f.endsWith(".png"))
        .sort();
    return files.map((file) => path_1.default.join(outputDir, file));
}
async function imageToBase64(imagePath) {
    const buffer = fs_1.default.readFileSync(imagePath);
    const optimized = await (0, sharp_1.default)(buffer)
        .resize({ width: 1000 })
        .png({ quality: 80 })
        .toBuffer();
    return optimized.toString("base64");
}
async function callVisionModel(imageBase64) {
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
async function main() {
    const pdfPath = "C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\test\\data\\cvs\\CV amal khalfaoui 2024.pdf";
    console.log("📄 Converting PDF to images...");
    const pages = await pdfToImages(pdfPath);
    console.log(`📑 Found ${pages.length} pages`);
    const results = [];
    for (let i = 0; i < pages.length; i++) {
        console.log(`🤖 Processing page ${i + 1}/${pages.length}`);
        try {
            const base64 = await imageToBase64(pages[i]);
            const result = await callVisionModel(base64);
            const clean = cleanJSON(result);
            try {
                results.push(JSON.parse(clean));
            }
            catch (e) {
                console.log("⚠️ Invalid JSON on page", i + 1);
                console.log(clean);
            }
            await sleep(1500);
        }
        catch (err) {
            console.log(`❌ Error on page ${i + 1}:`, err);
        }
    }
    console.log("\n========== FINAL RESULT ==========\n");
    console.dir(results, { depth: null });
}
main().catch(console.error);
//# sourceMappingURL=test-vlm.js.map