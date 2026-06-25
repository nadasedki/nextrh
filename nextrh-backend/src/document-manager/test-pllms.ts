import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { convert } from "pdf-poppler";
import Tesseract from "tesseract.js";
import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { PDFParse } from 'pdf-parse';
import * as natural from "natural"; // 👈 Ajout de la dépendance de distance linguistique

// ---------------- 1. DÉFINITION DES SCHÉMAS ZOD ----------------

const IdentitySchema = z.object({
  full_name: z.string().nullable().describe("Le nom et prénom du candidat"),
  job_title: z.string().nullable().describe("Le poste ou titre du profil"),
  contact: z.object({
    phone: z.string().nullable().describe("Le numéro de téléphone portable"),
    fax: z.string().nullable().describe("Le numéro de fax"),
    email: z.string().nullable().describe("L'adresse email corrigée et propre"),
    address: z.string().nullable().describe("L'adresse postale complète du candidat"),
  }).describe("Les informations de contact direct"),
});

const ExperienceSchema = z.object({
  experiences: z.array(
    z.object({
      company: z.string().describe("Le nom de l'entreprise ou l'organisme employeur"),
      position: z.string().describe("L'intitulé du poste occupé"),
      period: z.string().describe("La période ou date d'exercice"),
    })
  ).describe("Uniquement les postes et contrats de travail globaux en entreprise")
});

const ProjectSchema = z.object({
  projects: z.array(
    z.object({
      year: z.string().nullable().describe("L'année ou la période du projet spécifique"),
      client: z.string().describe("Le nom propre UNIQUE de l'entreprise ou institution cliente"),
      description: z.string().describe("Le détail technique de la mission ou de la licence livrée "),
    })
  ).describe("La liste des marchés, projets ou déploiements techniques unitaires exécutés pour des clients")
});

const EducationSchema = z.object({
  education: z.array(
    z.object({
      year: z.string().nullable().describe("L'année d'obtention ou de cursus"),
      institution: z.string().describe("L'école, université ou centre de formation"),
      degree: z.string().describe("Le nom du diplôme ou de la certification académique"),
    })
  )
});
const CertificationSchema = z.object({
  certifications: z.array(
    z.object({
      title: z.string().describe("Le nom officiel de la certification (Ex: Cisco Certified Design Professional)"),
      date: z.string().nullable().describe("La date ou le mois/année d'obtention (Ex: Février 2019)"),
    })
  )
});

const SkillsSchema = z.object({
  skills: z.array(z.string()).describe(
    "Une liste plate et propre de toutes les compétences techniques, langages, protocoles et outils trouvés dans le texte (Ex: 'LAN / WLAN / WAN', 'Java', 'Cisco')."
  )
});// ---------------- 2. UTILS, LOGS & SEGMENTATION ----------------

function saveDebugLog(text: string) {
  const logPath = path.join(__dirname, "extracted_text_debug.txt");
  fs.writeFileSync(logPath, text, "utf8");
  console.log(`📝 Text log saved for debug to: ${logPath}`);
}

// ---------------- 3. SEGMENTATION DU TEXTE ----------------
function segmentText(text: string): Record<string, string> {
  const lines = text.split('\n');
  const sections: Record<string, string[]> = {
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
    skills: ['compétences supplémentaires', 'compétences', 'skills', 'technical skills', 'competences'], // 👈 Ajout ici
  };

  let currentSection = 'header';

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();
    if (trimmedLine.length === 0) continue;

    let matchedSection: string | null = null;

    if (trimmedLine.length < 40) {
      for (const [sectionKey, synonyms] of Object.entries(headingSynonyms)) {
        for (const synonym of synonyms) {
          const score = natural.JaroWinklerDistance(trimmedLine, synonym);
          if (score > 0.88) {
            matchedSection = sectionKey;
            break;
          }
        }
        if (matchedSection) break;
      }
    }

    if (matchedSection) {
      currentSection = matchedSection;
    } else {
      sections[currentSection].push(line);
    }
  }

  const finalSections: Record<string, string> = {};
  for (const [key, linesArr] of Object.entries(sections)) {
    finalSections[key] = linesArr.join('\n').trim();
  }
  return finalSections;
}

// ---------------- 3. EXTRACTION NATIVE (SANS OCR) ----------------

async function extractNativeText(fileBuffer: Buffer): Promise<string | null> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getText();
    const rawText = result.text;

    if (rawText && rawText.trim().length > 150) {
      console.log("⚡ Success! Native digital text found via PDFParse class.");
      return rawText;
    }
  } catch (error) {
    console.warn("⚠️ Extraction native impossible ou crash du parser, passage à l'OCR.");
  } finally {
    await parser.destroy();
  }
  return null;
}

// ---------------- 4. PIPELINE OCR DE SECOURS (FALLBACK) ----------------

async function pdfToImages(pdfPath: string): Promise<string[]> {
  const outputDir = path.join(__dirname, "tmp_pages");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  await convert(pdfPath, {
    format: "png",
    out_dir: outputDir,
    out_prefix: "page",
    page: null,
    dpi: 150,
  });
  return fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".png"))
    .sort()
    .map((f) => path.join(outputDir, f));
}

async function runOCR(imagePath: string): Promise<string> {
  const result = await Tesseract.recognize(imagePath, "fra+eng", {
    // @ts-ignore
    tessedit_pageseg_mode: '11', 
    logger: () => {},
  });
  return result.data.text;
}

// ---------------- 5. MÉTHODE LANGCHAIN STRUCTURED OUTPUT ----------------

async function callLLMWithLangChain<T>(
  blockText: string,
  targetSection: string,
  zodSchema: z.ZodType<any>,
  instructions: string
): Promise<T> {
  const llm = new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: "qwen2.5:7b", 
    temperature: 0,
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
  return response as T;
}

// ---------------- 6. PIPELINE PRINCIPAL ----------------

async function main() {
  const pdfPath = "C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\test\\data\\cvs\\CV Anouar ABDALLAH .pdf";

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File not found at: ${pdfPath}`);
    return;
  }

  let fullText = "";

  console.log("🔍 Attempting Native PDF Text Extraction (No OCR)...");
  const fileBuffer = fs.readFileSync(pdfPath);
  const nativeText = await extractNativeText(fileBuffer);
  
  if (nativeText) {
    console.log("⚡ Success! Native digital text found. Skipping OCR pipeline.");
    fullText = nativeText;
  } else {
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

  // ✂️ APPLIQUER LA SEGMENTATION APRES L'EXTRACTION TEXTUELLE
  console.log("✂️ Segmenting raw text using Jaro-Winkler distance mapping...");
  const blocks = segmentText(fullText);

  console.log("\n🤖 Parsing segmented sections sequentially (CPU Optimized Style)...\n");

  const finalResult: any = {
    identity: null,
    experience: [],
    projects: [],
    education: [],
    certifications: [], 
    skills: []
  };

  // --- ÉTAPE 1 : IDENTITÉ (Reçoit uniquement le fragment 'header') ---
  try {
    console.log("👤 Extracting Personal Info & Contact Details...");
    const identityInput = blocks.header || fullText; // Fallback sécurité
    const infoInstructions = "Extract the candidate's name, current role, and the contact section from the provided text fragment.";
    finalResult.identity = await callLLMWithLangChain(identityInput, "Identity and Contact Information", IdentitySchema, infoInstructions);
  } catch (e) {
    console.error("⚠️ Failed to parse Personal Info:", e);
  }

  // --- ÉTAPE 2 : EXPÉRIENCES (Reçoit uniquement le fragment 'experience') ---
  try {
    console.log("💼 Extracting Corporate Experiences...");
    const expInput = blocks.experience || fullText;
    const expInstructions = "Extract jobs from the provided experience history fragment.";
    const result = await callLLMWithLangChain<any>(expInput, "Corporate Roles", ExperienceSchema, expInstructions);
    finalResult.experience = result?.experiences || [];
  } catch (e) {
    console.error("⚠️ Failed to parse Experiences:", e);
  }

  // --- ÉTAPE 3 : PROJETS (Reçoit uniquement le fragment 'projects') ---
  try {
    console.log("🚀 Reconstructing Tabular Client Projects...");
    const projectInput = blocks.projects || fullText;
    const projectInstructions = "Reconstruct tabular client projects. CRITICAL: Separate 'client' (corporate name only) from 'description' (technical details). Never merge technical text into the client field.";
    const result = await callLLMWithLangChain<any>(projectInput, "Tabular Client Projects", ProjectSchema, projectInstructions);
    finalResult.projects = result?.projects || [];
  } catch (e) {
    console.error("⚠️ Failed to parse Projects:", e);
  }

  // --- ÉTAPE 4 : FORMATIONS (Reçoit uniquement le fragment 'education') ---
  try {
    console.log("🎓 Extracting Academic Background...");
    const eduInput = blocks.education || fullText;
    const eduInstructions = "Extract academic degrees and institutions from the education fragment.";
    const result = await callLLMWithLangChain<any>(eduInput, "Education Background", EducationSchema, eduInstructions);
    finalResult.education = result?.education || [];
  } catch (e) {
    console.error("⚠️ Failed to parse Education:", e);
  }
  // --- ÉTAPE 5 : CERTIFICATIONS (Reçoit le fragment 'certification') ---
  try {
    console.log("📜 Extracting Technical Certifications...");
    const certInput = blocks.certification || fullText;
    const certInstructions = `
      Extract the technical credentials and their respective achievement dates.
      Note: The text might have vertical misalignment (e.g., titles listed first, then dates listed after). 
      Reconstruct the right pairs. Example: 'Cisco Certified Design Professional (CCDP)' belongs to 'Février 2019'.
    `;
    const result = await callLLMWithLangChain<any>(certInput, "Professional Certifications", CertificationSchema, certInstructions);
    finalResult.certifications = result?.certifications || [];
  } catch (e) {
    console.error("⚠️ Failed to parse Certifications:", e);
  }
// --- ÉTAPE 6 : COMPÉTENCES (Version Liste Simple) ---
  try {
    console.log("🛠️ Extracting Technical Skills List...");
    const skillsInput = blocks.skills || fullText;
    const skillsInstructions = `
      Extract all technical competencies, protocols, operating systems, hardware vendors, and programming languages as a simple, flat list of items.
      Do not create sub-categories. Just return each skill or tool as an individual string.
    `;
    const result = await callLLMWithLangChain<any>(skillsInput, "Technical Skills Inventory", SkillsSchema, skillsInstructions);
    finalResult.skills = result?.skills || [];
  } catch (e) {
    console.error("⚠️ Failed to parse Skills:", e);
  }

  console.log("\n========== FINAL PARSED JSON (LANGCHAIN + ZOD) ==========\n");
  console.dir(finalResult, { depth: null });
}

main().catch(console.error);