import fs from "fs";
import path from "path";
import { convert } from "pdf-poppler";
import Tesseract from "tesseract.js";
import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { PDFParse } from 'pdf-parse';
import * as natural from "natural";

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
});

// ---------------- 2. UTILS, LOGS & SEGMENTATION ----------------

function saveDebugLog(text: string) {
  const logPath = path.join(__dirname, "extracted_text_debug.txt");
  fs.writeFileSync(logPath, text, "utf8");
  console.log(`... Text log saved for debug to: ${logPath}`);
}

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
    skills: ['compétences supplémentaires', 'compétences', 'skills', 'technical skills', 'competences'], 
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

  console.log("✂️ Segmenting raw text using Jaro-Winkler distance mapping...");
  const blocks = segmentText(fullText);

  console.log("\n🤖 Parsing segmented sections concurrently (CPU Parallelized Style)...\n");
  const startTime = Date.now();

  const finalResult: any = {
    identity: null,
    experience: [],
    projects: [],
    education: [],
    certifications: [], 
    skills: []
  };

  // Préparation des instructions spécifiques pour chaque agent d'extraction
  const infoInstructions = "Extract the candidate's name, current role, and the contact section from the provided text fragment.";
  const expInstructions = "Extract jobs from the provided experience history fragment.";
  const projectInstructions = "Reconstruct tabular client projects. CRITICAL: Separate 'client' (corporate name only) from 'description' (technical details). Never merge technical text into the client field.";
  const eduInstructions = "Extract academic degrees and institutions from the education fragment.";
  const certInstructions = "Extract the technical credentials and their respective achievement dates. Reconstruct correct alignment pairs between title and dates.";
  
  // 💡 Contrainte négative stricte pour empêcher le mélange des certifications dans les compétences
  const skillsInstructions = `
    Extract all technical competencies, protocols, operating systems, hardware vendors, and programming languages as a simple, flat list of items.
    Do not create sub-categories. Just return each skill or tool as an individual string.
    CRITICAL NEGATIVE RULES:
    - NEVER include official certification titles, exam codes (e.g., codes ending in WBTT, MCSA, AIS, ASE), or training diplomas in this list.
    - If an item looks like a formal certification or an exam name, IGNORE IT.
  `;

  // 🚀 Lancement simultané (parallélisation multicœur CPU via Promise.all)
  try {
    const [identityRes, expRes, projRes, eduRes, certRes, skillsRes] = await Promise.all([
      callLLMWithLangChain<any>(blocks.header || fullText, "Identity and Contact Information", IdentitySchema, infoInstructions).catch(e => { console.error("⚠️ Identity failed:", e); return null; }),
      callLLMWithLangChain<any>(blocks.experience || fullText, "Corporate Roles", ExperienceSchema, expInstructions).catch(e => { console.error("⚠️ Experience failed:", e); return null; }),
      callLLMWithLangChain<any>(blocks.projects || fullText, "Tabular Client Projects", ProjectSchema, projectInstructions).catch(e => { console.error("⚠️ Projects failed:", e); return null; }),
      callLLMWithLangChain<any>(blocks.education || fullText, "Education Background", EducationSchema, eduInstructions).catch(e => { console.error("⚠️ Education failed:", e); return null; }),
      callLLMWithLangChain<any>(blocks.certification || fullText, "Professional Certifications", CertificationSchema, certInstructions).catch(e => { console.error("⚠️ Certifications failed:", e); return null; }),
      callLLMWithLangChain<any>(blocks.skills || fullText, "Technical Skills Inventory", SkillsSchema, skillsInstructions).catch(e => { console.error("⚠️ Skills failed:", e); return null; }),
    ]);

    // Assemblage final des données extraites
    finalResult.identity = identityRes;
    finalResult.experience = expRes?.experiences || [];
    finalResult.projects = projRes?.projects || [];
    finalResult.education = eduRes?.education || [];
    finalResult.certifications = certRes?.certifications || [];
    finalResult.skills = skillsRes?.skills || [];

  } catch (globalError) {
    console.error("💥 Critical execution error during orchestration:", globalError);
  }

  console.log(`\n⏱️ Orchestration complete! Total inference time: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds.`);
  console.log("\n========== FINAL PARSED JSON (LANGCHAIN + ZOD) ==========\n");
  console.dir(finalResult, { depth: null });
}

main().catch(console.error);