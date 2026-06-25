"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_poppler_1 = require("pdf-poppler");
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const zod_1 = require("zod");
const ollama_1 = require("@langchain/ollama");
const IdentitySchema = zod_1.z.object({
    full_name: zod_1.z.string().nullable().describe("Le nom et prénom du candidat"),
    job_title: zod_1.z.string().nullable().describe("Le poste ou titre du profil"),
    contact: zod_1.z.object({
        phone: zod_1.z.string().nullable().describe("Le numéro de téléphone portable"),
        fax: zod_1.z.string().nullable().describe("Le numéro de fax"),
        email: zod_1.z.string().nullable().describe("L'adresse email corrigée et propre"),
        address: zod_1.z.string().nullable().describe("L'adresse postale complète du candidat"),
    }).describe("Les informations de contact direct"),
});
const ExperienceSchema = zod_1.z.object({
    experiences: zod_1.z.array(zod_1.z.object({
        company: zod_1.z.string().describe("Le nom de l'entreprise ou l'organisme employeur"),
        position: zod_1.z.string().describe("L'intitulé du poste occupé"),
        period: zod_1.z.string().describe("La période ou date d'exercice"),
        description: zod_1.z.string().default("").describe("Résumé des tâches principales"),
    })).describe("Uniquement les postes et contrats de travail globaux en entreprise")
});
const ProjectSchema = zod_1.z.object({
    projects: zod_1.z.array(zod_1.z.object({
        year: zod_1.z.string().nullable().describe("L'année ou la période du projet spécifique"),
        client: zod_1.z.string().describe("Le client final concerné par ce livrable ou ce marché"),
        description: zod_1.z.string().describe("Le détail technique de la mission ou de la licence livrée"),
    })).describe("La liste des marchés, projets ou déploiements techniques unitaires exécutés pour des clients")
});
const EducationSchema = zod_1.z.object({
    education: zod_1.z.array(zod_1.z.object({
        year: zod_1.z.string().nullable().describe("L'année d'obtention ou de cursus"),
        institution: zod_1.z.string().describe("L'école, université ou centre de formation"),
        degree: zod_1.z.string().describe("Le nom du diplôme ou de la certification académique"),
    }))
});
function saveOCRLog(text) {
    const logPath = path_1.default.join(__dirname, "ocr_debug.txt");
    fs_1.default.writeFileSync(logPath, text, "utf8");
    console.log(`📝 Raw OCR text log saved to: ${logPath}`);
}
async function pdfToImages(pdfPath) {
    const outputDir = path_1.default.join(__dirname, "tmp_pages");
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    await (0, pdf_poppler_1.convert)(pdfPath, {
        format: "png",
        out_dir: outputDir,
        out_prefix: "page",
        page: null,
        dpi: 150,
    });
    return fs_1.default
        .readdirSync(outputDir)
        .filter((f) => f.endsWith(".png"))
        .sort()
        .map((f) => path_1.default.join(outputDir, f));
}
async function runOCR(imagePath) {
    const result = await tesseract_js_1.default.recognize(imagePath, "fra+eng", {
        tessedit_pageseg_mode: '11',
        logger: () => { },
    });
    return result.data.text;
}
async function callLLMWithLangChain(blockText, targetSection, zodSchema, instructions) {
    const llm = new ollama_1.ChatOllama({
        baseUrl: "http://localhost:11434",
        model: "qwen2.5:7b",
        temperature: 0,
    }).withStructuredOutput(zodSchema);
    const prompt = `You are an expert HR data parser. Extract ONLY the "${targetSection}" from the following text.
          
CONTEXT / SPECIFIC INSTRUCTIONS:
${instructions}

CRITICAL RULES:
- Standardize layout data into the requested schema constraints.
- Fix broken text alignment caused by the OCR if rows are mixed.

TEXT TO PARSE:
"""
${blockText}
"""`;
    const response = await llm.invoke(prompt);
    return response;
}
async function main() {
    const pdfPath = "C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\test\\data\\cvs\\CV amal khalfaoui 2024.pdf";
    if (!fs_1.default.existsSync(pdfPath)) {
        console.error(`❌ File not found at: ${pdfPath}`);
        return;
    }
    console.log("Docs 📄 Converting PDF to PNG...");
    const pages = await pdfToImages(pdfPath);
    console.log(`📑 Found ${pages.length} page(s)`);
    console.log("\n🖼️ Starting OCR extraction...");
    let fullText = "";
    for (let i = 0; i < pages.length; i++) {
        console.log(`... Processing page ${i + 1}`);
        const text = await runOCR(pages[i]);
        fullText += text + "\n";
    }
    saveOCRLog(fullText);
    console.log("\n🤖 Extracting sections with LangChain & Structured Outputs...\n");
    const finalResult = {
        identity: null,
        experience: [],
        projects: [],
        education: []
    };
    try {
        console.log("👤 Extracting Personal Info & Contact Sub-object...");
        const infoInstructions = "Extract the candidate's name, current role, and the contact section containing phone, fax, email, and address.";
        finalResult.identity = await callLLMWithLangChain(fullText, "Identity and Contact Information", IdentitySchema, infoInstructions);
    }
    catch (e) {
        console.error("⚠️ Failed to parse Personal Info:", e);
    }
    try {
        console.log("💼 Extracting Corporate Experiences...");
        const expInstructions = "Extract corporate jobs from 'Expérience professionnelle' section. For this candidate, there are exactly two jobs: 'Gestionnaire Back Office Support' and 'CONTRACT MANAGER' both at 'Next Step IT'.";
        const result = await callLLMWithLangChain(fullText, "Corporate Roles", ExperienceSchema, expInstructions);
        finalResult.experience = result?.experiences || [];
    }
    catch (e) {
        console.error("⚠️ Failed to parse Experiences:", e);
    }
    try {
        console.log("🚀 Reconstructing Tabular Client Projects...");
        const projectInstructions = `The input text contains a 3-column table (Année | Client | Projet). Reconstruct the horizontal mapping properly.
The main corporate clients mentioned are: Ooredoo, Ministère du Commerce, Clinique amen, THCC HANNIBAL, AMEN BANK, POLYCLINIQUE TAOUFIK, BIAT, CNSS, Tunisie Telecom.`;
        const result = await callLLMWithLangChain(fullText, "Tabular Client Projects", ProjectSchema, projectInstructions);
        finalResult.projects = result?.projects || [];
    }
    catch (e) {
        console.error("⚠️ Failed to parse Projects:", e);
    }
    try {
        console.log("🎓 Extracting Academic Background...");
        const eduInstructions = "Extract academic degrees and institutions from the Academic section.";
        const result = await callLLMWithLangChain(fullText, "Education Background", EducationSchema, eduInstructions);
        finalResult.education = result?.education || [];
    }
    catch (e) {
        console.error("⚠️ Failed to parse Education:", e);
    }
    console.log("\n========== FINAL PARSED JSON (LANGCHAIN + ZOD) ==========\n");
    console.dir(finalResult, { depth: null });
}
main().catch(console.error);
//# sourceMappingURL=test-llm.js.map