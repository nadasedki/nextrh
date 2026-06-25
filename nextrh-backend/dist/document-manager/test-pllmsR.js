"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const pdf_parse_1 = require("pdf-parse");
const natural = __importStar(require("natural"));
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
    })).describe("Uniquement les postes et contrats de travail globaux en entreprise")
});
const ProjectSchema = zod_1.z.object({
    projects: zod_1.z.array(zod_1.z.object({
        year: zod_1.z.string().nullable().describe("L'année ou la période du projet spécifique"),
        client: zod_1.z.string().describe("Le nom propre UNIQUE de l'entreprise ou institution cliente"),
        description: zod_1.z.string().describe("Le détail technique de la mission ou de la licence livrée "),
    })).describe("La liste des marchés, projets ou déploiements techniques unitaires exécutés pour des clients")
});
const EducationSchema = zod_1.z.object({
    education: zod_1.z.array(zod_1.z.object({
        year: zod_1.z.string().nullable().describe("L'année d'obtention ou de cursus"),
        institution: zod_1.z.string().describe("L'école, université ou centre de formation"),
        degree: zod_1.z.string().describe("Le nom du diplôme ou de la certification académique"),
    }))
});
const CertificationSchema = zod_1.z.object({
    certifications: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string().describe("Le nom officiel de la certification (Ex: Cisco Certified Design Professional)"),
        date: zod_1.z.string().nullable().describe("La date ou le mois/année d'obtention (Ex: Février 2019)"),
    }))
});
const SkillsSchema = zod_1.z.object({
    skills: zod_1.z.array(zod_1.z.string()).describe("Une liste plate et propre de toutes les compétences techniques, langages, protocoles et outils trouvés dans le texte (Ex: 'LAN / WLAN / WAN', 'Java', 'Cisco').")
});
function saveDebugLog(text) {
    const logPath = path_1.default.join(__dirname, "extracted_text_debug.txt");
    fs_1.default.writeFileSync(logPath, text, "utf8");
    console.log(`... Text log saved for debug to: ${logPath}`);
}
function segmentText(text) {
    const lines = text.split('\n');
    const sections = {
        header: [],
        experience: [],
        certification: [],
        education: [],
        projects: [],
        skills: [],
    };
    const headingSynonyms = {
        experience: ['expérience professionnelle', 'experiences', 'work history', 'career history', 'parcours professionnel'],
        certification: ['certification', 'certifications', 'certificats', 'credentials'],
        education: ['formation académique', 'formations', 'éducation', 'education', 'cursus'],
        projects: ['projets', 'projects', 'réalisations', 'key projects'],
        skills: ['compétences supplémentaires', 'compétences', 'skills', 'technical skills', 'competences'],
    };
    let currentSection = 'header';
    for (const line of lines) {
        const trimmedLine = line.trim().toLowerCase();
        if (trimmedLine.length === 0)
            continue;
        let matchedSection = null;
        if (trimmedLine.length < 40) {
            for (const [sectionKey, synonyms] of Object.entries(headingSynonyms)) {
                for (const synonym of synonyms) {
                    const score = natural.JaroWinklerDistance(trimmedLine, synonym);
                    if (score > 0.88) {
                        matchedSection = sectionKey;
                        break;
                    }
                }
                if (matchedSection)
                    break;
            }
        }
        if (matchedSection) {
            currentSection = matchedSection;
        }
        else {
            sections[currentSection].push(line);
        }
    }
    const finalSections = {};
    for (const [key, linesArr] of Object.entries(sections)) {
        finalSections[key] = linesArr.join('\n').trim();
    }
    return finalSections;
}
async function extractNativeText(fileBuffer) {
    const parser = new pdf_parse_1.PDFParse({ data: fileBuffer });
    try {
        const result = await parser.getText();
        const rawText = result.text;
        if (rawText && rawText.trim().length > 150) {
            console.log("⚡ Success! Native digital text found via PDFParse class.");
            return rawText;
        }
    }
    catch (error) {
        console.warn("⚠️ Extraction native impossible ou crash du parser, passage à l'OCR.");
    }
    finally {
        await parser.destroy();
    }
    return null;
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
        model: "qwen2.5:3b",
        temperature: 0,
        numCtx: 1024,
    }).withStructuredOutput(zodSchema);
    const prompt = `You are an expert HR data parser. Extract ONLY the "${targetSection}" from the following text.
          
CONTEXT / SPECIFIC INSTRUCTIONS:
${instructions}

CRITICAL RULES:
- Standardize layout data into the requested schema constraints.
- Fix broken text alignment caused by formatting or OCR if rows are mixed.

TEXT TO PARSE:
"""
${blockText}
"""`;
    const response = await llm.invoke(prompt);
    return response;
}
async function main() {
    const pdfPath = "C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\test\\data\\cvs\\CV Anouar ABDALLAH .pdf";
    if (!fs_1.default.existsSync(pdfPath)) {
        console.error(`❌ File not found at: ${pdfPath}`);
        return;
    }
    let fullText = "";
    console.log("🔍 Attempting Native PDF Text Extraction (No OCR)...");
    const fileBuffer = fs_1.default.readFileSync(pdfPath);
    const nativeText = await extractNativeText(fileBuffer);
    if (nativeText) {
        console.log("⚡ Success! Native digital text found. Skipping OCR pipeline.");
        fullText = nativeText;
    }
    else {
        console.log("📸 Native text empty or document is a scan. Running OCR Fallback...");
        console.log("Docs 📄 Converting PDF pages to PNG...");
        const pages = await pdfToImages(pdfPath);
        console.log(`📑 Found ${pages.length} page(s). Starting Tesseract extraction...`);
        for (let i = 0; i < pages.length; i++) {
            console.log(`... OCR Processing page ${i + 1}/${pages.length}`);
            const text = await runOCR(pages[i]);
            fullText += text + "\n";
        }
    }
    saveDebugLog(fullText);
    console.log("✂️ Segmenting raw text using Jaro-Winkler distance mapping...");
    const blocks = segmentText(fullText);
    console.log("\n🤖 Parsing segmented sections concurrently (CPU Parallelized Style)...\n");
    const startTime = Date.now();
    const finalResult = {
        identity: null,
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        skills: []
    };
    const infoInstructions = "Extract the candidate's name, current role, and the contact section from the provided text fragment.";
    const expInstructions = "Extract jobs from the provided experience history fragment.";
    const projectInstructions = "Reconstruct tabular client projects. CRITICAL: Separate 'client' (corporate name only) from 'description' (technical details). Never merge technical text into the client field.";
    const eduInstructions = "Extract academic degrees and institutions from the education fragment.";
    const certInstructions = "Extract the technical credentials and their respective achievement dates. Reconstruct correct alignment pairs between title and dates.";
    const skillsInstructions = `
    Extract all technical competencies, protocols, operating systems, hardware vendors, and programming languages as a simple, flat list of items.
    Do not create sub-categories. Just return each skill or tool as an individual string.
    CRITICAL NEGATIVE RULES:
    - NEVER include official certification titles, exam codes (e.g., codes ending in WBTT, MCSA, AIS, ASE), or training diplomas in this list.
    - If an item looks like a formal certification or an exam name, IGNORE IT.
  `;
    try {
        const [identityRes, expRes, projRes, eduRes, certRes, skillsRes] = await Promise.all([
            callLLMWithLangChain(blocks.header || fullText, "Identity and Contact Information", IdentitySchema, infoInstructions).catch(e => { console.error("⚠️ Identity failed:", e); return null; }),
            callLLMWithLangChain(blocks.experience || fullText, "Corporate Roles", ExperienceSchema, expInstructions).catch(e => { console.error("⚠️ Experience failed:", e); return null; }),
            callLLMWithLangChain(blocks.projects || fullText, "Tabular Client Projects", ProjectSchema, projectInstructions).catch(e => { console.error("⚠️ Projects failed:", e); return null; }),
            callLLMWithLangChain(blocks.education || fullText, "Education Background", EducationSchema, eduInstructions).catch(e => { console.error("⚠️ Education failed:", e); return null; }),
            callLLMWithLangChain(blocks.certification || fullText, "Professional Certifications", CertificationSchema, certInstructions).catch(e => { console.error("⚠️ Certifications failed:", e); return null; }),
            callLLMWithLangChain(blocks.skills || fullText, "Technical Skills Inventory", SkillsSchema, skillsInstructions).catch(e => { console.error("⚠️ Skills failed:", e); return null; }),
        ]);
        finalResult.identity = identityRes;
        finalResult.experience = expRes?.experiences || [];
        finalResult.projects = projRes?.projects || [];
        finalResult.education = eduRes?.education || [];
        finalResult.certifications = certRes?.certifications || [];
        finalResult.skills = skillsRes?.skills || [];
    }
    catch (globalError) {
        console.error("💥 Critical execution error during orchestration:", globalError);
    }
    console.log(`\n⏱️ Orchestration complete! Total inference time: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds.`);
    console.log("\n========== FINAL PARSED JSON (LANGCHAIN + ZOD) ==========\n");
    console.dir(finalResult, { depth: null });
}
main().catch(console.error);
//# sourceMappingURL=test-pllmsR.js.map