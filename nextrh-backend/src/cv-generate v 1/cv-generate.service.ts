import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import axios from 'axios';
import { CvService } from '../cvs/cv.service';

@Injectable()
export class CvGenerateService {
  constructor(private readonly cvService: CvService) {}

  /**
   * MÉTHODE PRINCIPALE : Appelée par le Controller
   * Gère le flux complet : Conversion, IA, et Injection
   */
  async processSmartTemplate(cvId: number, file: Express.Multer.File): Promise<Buffer> {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const tempDocxPath = path.join(uploadDir, `temp_${timestamp}.docx`);
    let workingDocxPath = tempDocxPath;

    try {
      // --- ÉTAPE 1 : OBTENIR UN FICHIER DOCX ---
      if (extension === '.pdf') {
        const tempPdfPath = path.join(uploadDir, `input_${timestamp}.pdf`);
        fs.writeFileSync(tempPdfPath, file.buffer);
        
        console.log('Conversion PDF vers DOCX en cours...');
        await this.convertPdfToDocx(tempPdfPath, tempDocxPath);
        
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
      } else {
        // Si c'est déjà un DOCX, on le sauvegarde pour que Python puisse le lire
        fs.writeFileSync(tempDocxPath, file.buffer);
      }

      // --- ÉTAPE 2 : EXTRAIRE LE TEXTE POUR LE LLM ---
      const extraction = await mammoth.extractRawText({ path: tempDocxPath });
      const templateText = extraction.value;

      // --- ÉTAPE 3 : RÉCUPÉRER LES DONNÉES DEPUIS POSTGRES ---
      const realData = await this.cvService.getFullCvData(cvId);

      // --- ÉTAPE 4 : APPEL OLLAMA POUR LE MAPPING SÉMANTIQUE ---
      const mapping = await this.getSmartMappingFromOllama(templateText, realData);

      // --- ÉTAPE 5 : INJECTION DES DONNÉES VIA PYTHON (Logic XML) ---
      const finalDocxPath = path.join(uploadDir, `final_${timestamp}.docx`);
      // On copie le fichier de travail vers le chemin final avant modification
      fs.copyFileSync(tempDocxPath, finalDocxPath);

      await this.injectDataWithPython(finalDocxPath, mapping);

      // --- ÉTAPE 6 : LIRE LE RÉSULTAT ET NETTOYER ---
      const finalBuffer = fs.readFileSync(finalDocxPath);

      // Nettoyage des fichiers temporaires
      if (fs.existsSync(tempDocxPath)) fs.unlinkSync(tempDocxPath);
      if (fs.existsSync(finalDocxPath)) fs.unlinkSync(finalDocxPath);

      return finalBuffer;

    } catch (error) {
      console.error('Erreur lors du traitement du template:', error);
      throw new InternalServerErrorException(`Erreur de génération : ${error.message}`);
    }
  }

  /**
   * LOGIQUE OLLAMA : Analyse le texte du template et crée le mapping
   */
private async getSmartMappingFromOllama(templateText: string, realData: any) {
  // --- ÉTAPE 1 : On pré-formate les données PostgreSQL en blocs textuels "propres" ---
  // Cela garantit que les données ne sont pas modifiées par l'IA
  const dataBlocks = {
    identity_block: `${realData.full_name}\n${realData.profession}`,
    contact_block: `Email: ${realData.email}\nTél: ${realData.phone}\nFax: ${realData.fax || ''}\nAdresse: ${realData.address}`,
    skills_block: realData.skills.join(' • '),
    certifications_block: realData.certifications.map(c => `• ${c.cert_name} (${c.provider})`).join('\n'),
    education_block: realData.education.map(e => `• ${e.end_year || ''}: ${e.degree} - ${e.institution}`).join('\n'),
    experiences_block: realData.experiences.map(ex => {
      const year = ex.start_date ? new Date(ex.start_date).getFullYear() : '';
      return `• ${year}: ${ex.role} chez ${ex.company}\n  ${ex.description}`;
    }).join('\n')
  };

  // --- ÉTAPE 2 : Le Prompt "Smarter" ---
  const prompt = `
    Tu es un Expert en Architecture Documentaire. Tu dois remplacer le contenu d'un CV Template par mes DONNÉES RÉELLES.
    
    TEXTE DU TEMPLATE : 
    "${templateText}"

    DONNÉES RÉELLES (Source de Vérité) :
    ${JSON.stringify(dataBlocks)}

    MISSION :
    Génère un JSON PLAT de type { "Texte à supprimer" : "Texte à injecter" }.

    RÈGLES DE REMPLACEMENT :
    1. SOUVERAINETÉ : Toutes mes "DONNÉES RÉELLES" doivent apparaître. Si le template n'a pas de place pour le "Fax", ajoute-le dans le "contact_block".
    2. NETTOYAGE : Si une section du template n'existe pas dans mes données (ex: "LANGUES", "CENTRES D’INTÉRÊT" ou pubs "AZURIUS"), remplace-la par "".
    3. ANCRAGE : Identifie la ligne d'exemple dans le template (ex: "Forename SURNAME") et remplace-la par le bloc correspondant (ex: "identity_block").
    4. REFLOW : Utilise "\\n" dans les valeurs pour que le script Python crée de nouvelles lignes.

    RETOURNE UNIQUEMENT LE JSON PLAT.
  `;

  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'qwen2.5:7b',
    prompt: prompt,
    stream: false,
    format: 'json', // On force le format JSON
  });

  const mapping = JSON.parse(response.data.response);
  console.log('--- MAPPING SÉMANTIQUE ---', mapping);
  return mapping;
}

  /**
   * APPEL PYTHON : Conversion PDF vers DOCX
   */
  private convertPdfToDocx(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'src', 'cv-generate', 'convertpdf.py');
      const pythonPath = 'C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\python-env\\Scripts\\python.exe';

      const pyProcess = spawn(pythonPath, [scriptPath, inputPath, outputPath]);

      pyProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`La conversion Python a échoué (code ${code})`));
      });
    });
  }

  /**
   * APPEL PYTHON : Remplacement de texte intelligent dans le DOCX
   */
  private async injectDataWithPython(docxPath: string, mapping: any): Promise<void> {
  // 1. Créer un chemin pour un fichier JSON temporaire
  const mappingPath = path.join(process.cwd(), 'uploads', `map_${Date.now()}.json`);
  
  // 2. Écrire le dictionnaire dans ce fichier
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'src', 'cv-generate', 'smart_replace.py');
    const pythonPath = 'C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\python-env\\Scripts\\python.exe';

    // 3. Envoyer le CHEMIN du fichier JSON à Python, pas le texte brut
    const pyProcess = spawn(pythonPath, [scriptPath, docxPath, mappingPath]);

    pyProcess.on('close', (code) => {
      // 4. Nettoyer le fichier JSON après usage
      if (fs.existsSync(mappingPath)) fs.unlinkSync(mappingPath);
      
      if (code === 0) resolve();
      else reject(new Error(`L'injection Python a échoué (code ${code})`));
    });

    pyProcess.stderr.on('data', (data) => {
      console.error('PYTHON ERROR:', data.toString());
    });
  });
}
}