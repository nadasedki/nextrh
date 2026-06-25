import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { convert } from "pdf-poppler";
import Tesseract from "tesseract.js";
import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { PDFParse } from 'pdf-parse';
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
      client: z.string().describe("Le client final concerné par ce livrable ou ce marché"),
      description: z.string().describe("Le détail technique de la mission ou de la licence livrée"),
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

// ---------------- 2. UTILS & LOGS ----------------

function saveDebugLog(text: string) {
  const logPath = path.join(__dirname, "extracted_text_debug.txt");
  fs.writeFileSync(logPath, text, "utf8");
  console.log(`📝 Text log saved for debug to: ${logPath}`);
}

// ---------------- 3. EXTRACTION NATIVE (SANS OCR) ----------------

// Remplace la section 3 du code précédent par ta méthode adaptée :

async function extractNativeText(fileBuffer: Buffer): Promise<string | null> {
  // On instancie comme tu l'as montré
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getText();
    const rawText = result.text;

    // Si on extrait un volume de texte significatif, on valide
    if (rawText && rawText.trim().length > 150) {
      console.log("⚡ Success! Native digital text found via PDFParse class.");
      return rawText;
    }
  } catch (error) {
    console.warn("⚠️ Extraction native impossible ou crash du parser, passage à l'OCR.");
  } finally {
    // Très important pour éviter les fuites de mémoire (memory leaks)
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
    tessedit_pageseg_mode: '11', // Mode Sparse Text optimisé pour capturer les zones tabulaires isolées
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
  const pdfPath = "C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\test\\data\\cvs\\CV amal khalfaoui 2024.pdf";

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File not found at: ${pdfPath}`);
    return;
  }

  let fullText = "";

  // 🔄 ÉTAPE UNIQUE : Tentative d'extraction intelligente
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

  console.log("\n🤖 Parsing extracted sections with LangChain & Structured Outputs...\n");

  const finalResult: any = {
    identity: null,
    experience: [],
    projects: [],
    education: []
  };

  // --- ÉTAPE 1 : IDENTITÉ ---
  try {
    console.log("👤 Extracting Personal Info & Contact Details...");
    const infoInstructions = "Extract the candidate's name, current role, and the contact section containing phone, fax, email, and address.";
    finalResult.identity = await callLLMWithLangChain(fullText, "Identity and Contact Information", IdentitySchema, infoInstructions);
  } catch (e) {
    console.error("⚠️ Failed to parse Personal Info:", e);
  }

  // --- ÉTAPE 2 : EXPÉRIENCES ---
  try {
    console.log("💼 Extracting Corporate Experiences...");
    const expInstructions = "Extract corporate jobs from 'Expérience professionnelle' section. Ensure you map the fields correctly into the experiences array.";
    const result = await callLLMWithLangChain<any>(fullText, "Corporate Roles", ExperienceSchema, expInstructions);
    finalResult.experience = result?.experiences || [];
  } catch (e) {
    console.error("⚠️ Failed to parse Experiences:", e);
  }

  // --- ÉTAPE 3 : PROJETS ---
  try {
    console.log("🚀 Reconstructing Tabular Client Projects...");
    const projectInstructions = "The input contains tabular project/client mappings. Reconstruct horizontal mapping properly into the projects array.";
    const result = await callLLMWithLangChain<any>(fullText, "Tabular Client Projects", ProjectSchema, projectInstructions);
    finalResult.projects = result?.projects || [];
  } catch (e) {
    console.error("⚠️ Failed to parse Projects:", e);
  }

  // --- ÉTAPE 4 : FORMATIONS ---
  try {
    console.log("🎓 Extracting Academic Background...");
    const eduInstructions = "Extract academic degrees and institutions from the Academic section into the education array.";
    const result = await callLLMWithLangChain<any>(fullText, "Education Background", EducationSchema, eduInstructions);
    finalResult.education = result?.education || [];
  } catch (e) {
    console.error("⚠️ Failed to parse Education:", e);
  }

  console.log("\n========== FINAL PARSED JSON (LANGCHAIN + ZOD) ==========\n");
  console.dir(finalResult, { depth: null });
}

main().catch(console.error);