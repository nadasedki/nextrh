import { Injectable, Logger } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';
import { CvService } from '../cv.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorService } from '../vector/vector.service';
import { OnEvent } from '@nestjs/event-emitter';
@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);
 
  constructor(
    private readonly cvService: CvService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorService: VectorService,
  ) {}
// Dans src/rag/indexing/indexing.service.ts

@OnEvent('certification.saved') // Déclenché pour Create et Update
async handleCertificationSaved(payload: any) {
  // 🚀 EXTRACTION DE L'ID : On récupère le certId niché à l'intérieur de l'objet payload
  const certId = payload?.certId;

  // Sécurité au cas où le payload n'est pas au bon format
  if (!certId) {
    this.logger.error(`❌ Impossible de ré-indexer : 'certId' est introuvable dans le payload de l'événement.`);
    return;
  }

  // Désormais, certId est bien un 'number', le log va afficher le bon ID et PostgreSQL sera ravi !
  this.logger.log(`🔄 Ré-indexation de la certification #${certId}`);
  
  // 1. Récupérer la certif avec les infos du CV
  const cert = await this.cvService.getCertificationWithCvContext(certId);
  if (!cert) return;

  // 2. Supprimer l'ancien vecteur (si c'est un update)
  await this.vectorService.deleteByEntityId(certId, 'certification');

  // 3. Créer le nouveau vecteur
  const identityHeader = `CANDIDAT: ${cert.full_name}\nPROFESSION: ${cert.profession || 'N/A'}\n`;
  const text = `${identityHeader}CERTIFICATION: ${cert.cert_name}\nORGANISME: ${cert.provider}\nDATE: ${cert.issue_date}`;
  
  const point = await this.createVectorPoint(text, cert, 'certification', certId);
  
  // 4. Upsert dans Qdrant
  await this.vectorService.insertBatch([point]);
}

@OnEvent('certification.deleted')
async handleCertificationDeleted(payload: { certId: number }) {
  this.logger.log(`🗑️ Suppression du vecteur pour la certification #${payload.certId}`);
  await this.vectorService.deleteByEntityId(payload.certId, 'certification');
}
  /**
   * Méthode principale qui synchronise toute la base PostgreSQL vers Qdrant
   */
  async indexAllCVs(): Promise<{ totalCVs: number; totalPoints: number }> {
    this.logger.log('🚀 Démarrage de l\'indexation globale des CVs...');
    await this.vectorService.recreateCollection();
    this.logger.log('recreated the collection');
   
    const cvs = await this.cvService.getAllCVs();
    let totalPointsCount = 0;

    for (const cv of cvs) {
      try {
        if (!cv.cv_id) continue;

        const points = [];
        // Le Header Sémantique : permet à chaque vecteur de savoir à qui il appartient
        const identityHeader = `CANDIDAT: ${cv.full_name}\nPROFESSION: ${cv.profession || 'N/A'}\n`;

        // --- 1. INDEXATION DU PROFIL (Identité + Skills) ---
        const profileText = `${identityHeader}INFOS CONTACT & RÉSUMÉ:\nEmail: ${cv.email}\nAdresse: ${cv.address}\nCompétences: ${cv.skills}`;
        points.push(await this.createVectorPoint(profileText, cv, 'profile', cv.cv_id));

        // --- 2. INDEXATION DES CERTIFICATIONS ---
        const certifications = await this.cvService.getCertificationsByCvId(cv.cv_id);
        for (const cert of certifications) {
          const text = `${identityHeader}CERTIFICATION: ${cert.cert_name}\nORGANISME: ${cert.provider}\nOBTENUE LE: ${cert.issue_date || 'N/A'}`;
          points.push(await this.createVectorPoint(text, cv, 'certification', cert.certId));
        }

        // --- 3. INDEXATION DE L'ÉDUCATION ---
        const education = await this.cvService.getEducationByCvId(cv.cv_id);
        for (const edu of education) {
          const text = `${identityHeader}FORMATION: ${edu.degree}\nINSTITUTION: ${edu.institution}\nDOMAINE: ${edu.field_of_study}\nPÉRIODE: ${edu.start_year}-${edu.end_year}`;
          points.push(await this.createVectorPoint(text, cv, 'education', edu.education_id));
        }

        // --- 4. INDEXATION DES PROJETS ---
        const projects = await this.cvService.getProjectsByCvId(cv.cv_id);
        for (const proj of projects) {
          const text = `${identityHeader}PROJET: ${proj.name}\nCLIENT: ${proj.client}\nDATES: ${proj.start_date}-${proj.end_date}\nDESCRIPTION: ${proj.description}\nTECHNO: ${proj.technologies}`;
          points.push(await this.createVectorPoint(text, cv, 'project', proj.id));
        }

        // --- 5. INDEXATION DES EXPÉRIENCES ---
        const experiences = await this.cvService.getExperiencesByCvId(cv.cv_id);
        for (const exp of experiences) {
          const text = `${identityHeader}EXPÉRIENCE: ${exp.role}\nENTREPRISE: ${exp.company}\nDATES: ${exp.start_date}-${exp.end_date}\nMISSIONS: ${exp.description}`;
          points.push(await this.createVectorPoint(text, cv, 'experience', exp.id));
        }

        // --- ENVOI GROUPÉ (BATCH) VERS QDRANT ---
        if (points.length > 0) {
          await this.vectorService.insertBatch(points);
          totalPointsCount += points.length;
          this.logger.log(`✅ Indexé : ${cv.full_name} (${points.length} vecteurs)`);
        }

      } catch (err) {
        this.logger.error(`❌ Erreur lors de l'indexation du CV #${cv.cv_id}: ${err.message}`);
      }
    }

    this.logger.log(`🏁 Indexation terminée. Total : ${cvs.length} CVs, ${totalPointsCount} points vectoriels.`);
    return { totalCVs: cvs.length, totalPoints: totalPointsCount };
  }

  /**
   * Helper pour créer un point Qdrant avec embedding et métadonnées riches
   */
  private async createVectorPoint(text: string, cv: any, type: string, entityId: number) {
    // Appel au service d'Embedding (Ollama)
    const vector = await this.embeddingService.embed(text);
 const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
 const deterministicId = uuidv5(`${type}-${entityId}`, MY_NAMESPACE);

    return {
      id: deterministicId, // ID unique pour Qdrant
      vector: vector,
      payload: {
        text: text,             // Texte complet pour que le LLM puisse lire
        type: type,             // certification, project, etc.
        cv_id: cv.cv_id,        // ID pour le lien SQL
        entity_id: entityId,    // ID de la ligne SQL (ex: project_id)
        full_name: cv.full_name,
        source_table: this.mapTypeToTable(type),
        indexed_at: new Date().toISOString()
      },
    };
  }

  /**
   * Helper pour la traçabilité des sources
   */
  private mapTypeToTable(type: string): string {
    const mapping = {
      profile: 'cvs',
      certification: 'certifications',
      project: 'projects',
      education: 'education',
      experience: 'experiences'
    };
    return mapping[type] || 'unknown';
  }

}