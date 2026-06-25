import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import axios from 'axios';
import { CvService } from '../cvs/cv.service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import htmlToDocx from 'html-to-docx';

@Injectable()
export class CvGenerateService {
  constructor(private readonly cvService: CvService) {
    this.setupHandlebars();
  }

  private setupHandlebars() {
    // Helper pour les dates
    handlebars.registerHelper('formatDate', (date) => {
      if (!date) return 'Présent';
      try { return format(new Date(date), 'MMMM yyyy', { locale: fr }); }
      catch { return date; }
    });

    // Helper de comparaison
    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });
  }

  async processSmartPdf(cvId: number, file: Express.Multer.File): Promise<Buffer> {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const tempDocxPath = path.join(uploadDir, `template_${timestamp}.docx`);

    try {
      // 1. Conversion PDF vers DOCX si nécessaire
      if (path.extname(file.originalname).toLowerCase() === '.pdf') {
        const tempPdf = path.join(uploadDir, `in_${timestamp}.pdf`);
        fs.writeFileSync(tempPdf, file.buffer);
        await this.convertPdfToDocx(tempPdf, tempDocxPath);
        fs.unlinkSync(tempPdf);
      } else {
        fs.writeFileSync(tempDocxPath, file.buffer);
      }
//pdf -> word ?? pdf-parse
      // 2. Extraction HTML via Mammoth
     // const { value: rawHtmlStructure } = await mammoth.convertToHtml({ path: tempDocxPath });
      const { value: rawHtmlStructure } = await mammoth.convertToHtml({  path: tempDocxPath }, 
{
    styleMap: [
      "p[style-name='Heading 1'] => h1.cv-title",
      "p[style-name='Heading 2'] => h2.cv-section",
      "table => table.cv-table", // On force une classe sur les tables
      "tr => tr",
      "td => td",
      "b => strong.bold-text",
      "i => i.italic-text"
    ]
  });
      console.log('--- HTML EXTRAIT DU DOCX (MAMMOTH) ---');
      console.log(rawHtmlStructure.substring(0, 500) + '...');

      // 3. Données Postgres
      const realData = await this.cvService.getFullCvData(cvId);
       console.log(realData);
      // 4. Inférence IA (Template Handlebars)
      const smartHandlebarsTemplate = await this.askQwenToCreateTemplate(rawHtmlStructure,realData);
      console.log('--- TEMPLATE GÉNÉRÉ PAR L\'IA ---');
      console.log(smartHandlebarsTemplate);
      // Dans processSmartPdf, avant : const compiledTemplate = handlebars.compile(smartHandlebarsTemplate);

    // 5. Injection Handlebars
      const compiledTemplate = handlebars.compile(smartHandlebarsTemplate);
      const injectedHtmlFragment = compiledTemplate(realData);

      // 6. Rendu PDF final
      //const finalPdfBuffer = await this.renderFinalPdf(injectedHtmlFragment);
      const finalPdfBuffer = await this.renderDocx(injectedHtmlFragment);

      if (fs.existsSync(tempDocxPath)) fs.unlinkSync(tempDocxPath);
      return finalPdfBuffer;

    } catch (error) {
      console.error('Pipeline Error:', error);
      throw new InternalServerErrorException(`Erreur: ${error.message}`);
    }
  }

private async askQwenToCreateTemplate(htmlStructure: string, realData: any,): Promise<string> {
const prompt = `
[SYSTEM_INSTRUCTION]
Tu es un moteur de transformation de code. Ta tâche est de convertir du HTML statique en un template Handlebars (.hbs) en remplaçant les données textuelles par des balises dynamiques.

--- RÈGLES D'OR (STRICTES) ---
1. INTERDICTION DE RECOPIER : Toute donnée personnelle (nom, entreprise, école, dates, ville) présente dans le HTML source doit être DISPARAITRE et être remplacée par sa balise {{tag}} correspondante.
2. INTÉGRITÉ HTML : Ne modifie AUCUNE balise HTML. Conserve précieusement les <table>, <tr>, <td>, <ul>, <li> et les classes CSS (ex: class="bold-text").
3. LOGIQUE DE RÉPÉTITION :
   - Identifie les blocs qui se répètent (ex: une ligne <tr> qui contient une expérience).
   - Ne garde qu'UN SEUL bloc exemplaire.
   - Enveloppe ce bloc avec {{#each nom_section}} ... {{/each}}.
4. AUCUN TEXTE : Ne fournis aucune explication. La sortie doit commencer par <html> et finir par </html>.

--- MAPPING DES COMPOSANTS ---
- IDENTITÉ : Texte du nom -> {{full_name}}, Texte du poste -> {{profession}}
- CONTACT : Email -> {{email}}, Téléphone -> {{phone}}, Fax -> {{fax}}, Adresse -> {{address}}
- COMPÉTENCES : Groupe de mots-clés -> {{#each skills}} {{this}} {{/each}}

--- STRUCTURES DE BOUCLES (ITÉRATIONS) ---
- EXPÉRIENCES :
  {{#each experiences}}
    Remplacer Poste par: {{role}}
    Remplacer Entreprise par: {{company}}
    Remplacer Dates par: {{formatDate start_date}} - {{formatDate end_date}}
    Remplacer Description par: {{description}}
  {{/each}}

- ÉDUCATION :
  {{#each education}}
    Remplacer Diplôme par: {{degree}}
    Remplacer École par: {{institution}}
    Remplacer Période par: {{start_year}} - {{end_year}}
  {{/each}}

- PROJETS :
  {{#each projects}}
    Remplacer Nom par: {{name}}
    Remplacer Client par: {{client}}
    Remplacer Année par: {{year}}
    Remplacer Description par: {{description}}
  {{/each}}

- CERTIFICATIONS :
  {{#each certifications}}
    Remplacer Nom par: {{cert_name}} | {{provider}} | {{formatDate issue_date}}
  {{/each}}

--- HTML SOURCE À TRAITER ---
${htmlStructure}`

/*const prompt = 
[SYSTEM_INSTRUCTION]

Tu es un moteur de fusion de documents.

Ta mission est de prendre :

1. Un modèle HTML (template CV)
2. Des données structurées fournies en entrée

et de produire directement le HTML final rempli.

--- RÈGLES STRICTES ---

1. Conserve la structure HTML existante :

   * Ne supprime aucune balise importante.
   * Conserve les tableaux (<table>, <tr>, <td>), listes (<ul>, <li>) et classes CSS.

2. Remplace toutes les données du modèle par les données fournies.

   * N'utilise jamais de placeholders Handlebars.
   * N'utilise jamais {{variable}}.

3. Si une section du modèle correspond à une liste de données :

   * Génère autant d'éléments HTML que nécessaire.
   * Exemple : plusieurs expériences => plusieurs lignes ou blocs HTML.

4. Si une donnée n'existe pas :

   * Laisse la zone vide.
   * N'invente jamais d'information.

5. N'ajoute aucun commentaire, aucune explication, aucun texte hors HTML.

6. La sortie doit être un HTML complet commençant par :

<html>

et se terminant par :

</html>

--- DONNÉES À INSÉRER ---

${JSON.stringify(realData, null, 2)}

--- HTML SOURCE ---

${htmlStructure}

--- SORTIE ATTENDUE ---

Retourne uniquement le HTML final rempli avec les données.

`;*/


    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
       // model: 'qwen2.5:3b-instruct-q4_K_M',
      model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: { temperature: 0, num_predict: 4000 }
      }, { timeout: 0 });

      let html = response.data.response;

      // Nettoyage pour isoler le HTML pur
      const firstBracket = html.indexOf('<');
      const lastBracket = html.lastIndexOf('>');
      if (firstBracket !== -1 && lastBracket !== -1) {
        html = html.substring(firstBracket, lastBracket + 1);
      }
      return html.replace(/```html/gi, '').replace(/```/g, '').trim();
    } catch (error) {
      console.error('Ollama Error:', error.message);
      throw new Error("L'IA n'a pas pu traiter la structure complexe des données.");
    }
  }

  private async renderFinalPdf(content: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // On prépare un document propre pour Puppeteer
    const fullHtml = `
     <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; }
          
          /* Style pour conserver la structure des tableaux */
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          td { vertical-align: top; padding: 8px; border: 0px solid #eee; } /* Bordures invisibles par défaut comme dans Word */
          
          .cv-title { color: #000; font-size: 26px; border-bottom: 2px solid #000; }
          .cv-section { color: #000; font-size: 18px; margin-top: 25px; border-bottom: 1px solid #e5e7eb; }
          
          /* Pour les listes au cas où */
          ul { padding-left: 20px; }
          li { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  private async convertPdfToDocx(input: string, output: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const pyPath = 'C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\python-env\\Scripts\\python.exe';
      const script = path.join(process.cwd(), 'src', 'cv-generate', 'convertpdf.py');
      const pyProcess = spawn(pyPath, [script, input, output]);
      pyProcess.on('close', (code) => code === 0 ? resolve() : reject(new Error('Conv Error')));
    });
  }


  
private async renderDocx(content: string): Promise<Buffer> {
  const styledHtml = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial;
            padding: 30px;
            color: #000;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          td {
            padding: 8px;
            vertical-align: top;
          }

          .cv-title {
            font-size: 26px;
            border-bottom: 2px solid #000;
          }

          .cv-section {
            font-size: 18px;
            border-bottom: 1px solid #000;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;

  const docxBuffer = await htmlToDocx(styledHtml);

  return docxBuffer;
}
}