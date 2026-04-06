import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CvService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}


async getAllCVs() {
  try {
  const cvs = await this.dataSource.query('SELECT * FROM cvs');
  
  for (const cv of cvs) {
    const [certs, edus, projs, exps] = await Promise.all([
      this.dataSource.query('SELECT * FROM certifications WHERE "cvCvId"=$1', [cv.cv_id]),
      this.dataSource.query('SELECT * FROM education WHERE "cvCvId"=$1', [cv.cv_id]),
      this.dataSource.query('SELECT * FROM projects WHERE "cvCvId"=$1', [cv.cv_id]),
      this.dataSource.query('SELECT * FROM experiences WHERE "cvCvId"=$1', [cv.cv_id]),
    ]);

    cv.certifications = certs;
    cv.education = edus;
    cv.projects = projs;
    cv.experiences = exps;
    
    // On reconstruit le texte SANS DOUBLONS et avec le NOM PARTOUT
    cv.fullText = this.buildText(cv); 
  }
  return cvs;
  } catch (err) {
      console.error('Erreur SQL:', err.message);
      return [];
    }
}


private buildText(cv: any): string {
  if (!cv) return '';
  
  // On utilise "Set" pour s'assurer que chaque ligne est UNIQUE
  const certs = new Set(cv.certifications?.map(c => `- ${c.cert_name} (${c.provider})`));
  const edus = new Set(cv.education?.map(e => `- ${e.degree} en ${e.field_of_study} à ${e.institution}`));
  const projs = new Set(cv.projects?.map(p => `- ${p.name}: ${p.description}`));
  const exps = new Set(cv.experiences?.map(exp => `- ${exp.role} chez ${exp.company}: ${exp.description}`));

  let text = `IDENTITÉ: ${cv.full_name}\nPROFESSION: ${cv.profession || 'N/A'}\n`;
  text += `RÉSUMÉ: ${cv.summary || ''}\n\n`;

  if (certs.size > 0) text += `CERTIFICATIONS:\n${Array.from(certs).join('\n')}\n\n`;
  if (edus.size > 0) text += `ÉDUCATION:\n${Array.from(edus).join('\n')}\n\n`;
  if (projs.size > 0) text += `PROJETS:\n${Array.from(projs).join('\n')}\n\n`;
  if (exps.size > 0) text += `EXPÉRIENCES:\n${Array.from(exps).join('\n')}\n\n`;

  return text.trim();
}

  // CHUNKING  Découpe par paragraphes pour garder le sens
  chunkText(text: string, chunkSize = 800): string[] {
    if (!text) return [];
    const paragraphs = text.split('\n\n');
    const chunks = [];
    let currentChunk = "";

    for (const para of paragraphs) {
      if ((currentChunk.length + para.length) > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = para;
      } else {
        currentChunk += "\n\n" + para;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }
  // 

async getAllNames(): Promise<string[]> {
  try {
    // On récupère uniquement les noms non nuls et distincts
    const result = await this.dataSource.query(
      'SELECT DISTINCT full_name FROM cvs WHERE full_name IS NOT NULL'
    );
    // On transforme le résultat [{full_name: 'Aya...'}, ...] en ['Aya...', ...]
    return result.map(r => r.full_name);
  } catch (err) {
    console.error('Erreur lors de la récupération des noms:', err.message);
    return [];
  }
}
}