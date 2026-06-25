import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { GoogleCalendarService } from 'src/google-calendar/google-calendar.service';
import { ScoringService } from 'src/scoring/scoring.service';

interface CertificationSavedPayload {
  employeeId: number;
  certName: string;
  expiryDate: Date | null;
}

interface CertificationEventPayload {
  employeeId: number;
  certId: number;
}

@Injectable()
export class CertificationsListener {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly scoringService: ScoringService,
  ) {}

  /**
   * 1. Écouteur déclenché APRÈS la création réussie d'une certification
   * But : Planifier l'alerte Google Calendar (J-60 pour n8n) et mettre à jour le score de l'employé
   */
  @OnEvent('certification.saved')
  async handleCertificationSaved(payload: CertificationSavedPayload) {
    const { employeeId, certName, expiryDate } = payload;
    console.log(` [Event-Listener] Traitement en tâche de fond pour la nouvelle certification : "${certName}"`);

    // --- EFFET SECONDAIRE 1 : Calcul et mise à jour du Score ---
    try {
      await this.scoringService.calculateAndSaveScore(employeeId);
      console.log(` [Event-Listener] Score recalculé avec succès pour l'employé ID: ${employeeId}`);
    } catch (scoreError) {
      console.error(` [Event-Listener] Échec du recalcul du score :`, scoreError.message);
    }

    // --- EFFET SECONDAIRE 2 : Synchronisation Google Calendar ---
    if (!expiryDate) {
      console.log(` [Event-Listener] Pas de date d'expiration pour "${certName}". Synchro Calendar ignorée.`);
      return;
    }

    try {
      // Récupération des informations de profil de l'employé (Nom complet et Email)
      const user = await this.userRepo.findOne({ where: { user_id: employeeId } });

      if (user && user.email) {
        // Conversion de la Date en String ISO pour le service Google
        const expiryDateStr = expiryDate instanceof Date ? expiryDate.toISOString() : new Date(expiryDate).toISOString();

        // Appel de ta méthode existante Google Calendar Service
        await this.googleCalendarService.scheduleEmployeeReminder(
          user.full_name,
          user.email,
          certName,
          expiryDateStr,
        );
        console.log(` [Event-Listener] Rappel d'expiration planifié à J-60 dans l'agenda pour ${user.email}`);
      } else {
        console.warn(` [Event-Listener] Impossible de planifier l'agenda : Employé introuvable ou email manquant.`);
      }
    } catch (calendarError) {
      // Fail-soft : l'erreur est loggée mais n'impacte pas l'application principale
      console.error(` [Event-Listener] Erreur Google Calendar :`, calendarError.message);
    }
  }

  /**
   * 2. Écouteur déclenché APRÈS la mise à jour d'une certification
   * But : Recalculer le score de l'employé en arrière-plan
   */
  @OnEvent('certification.updated')
  async handleCertificationUpdated(payload: CertificationEventPayload) {
    const { employeeId, certId } = payload;
    console.log(` [Event-Listener] Certification ID: ${certId} mise à jour. Recalcul du score...`);

    try {
      await this.scoringService.calculateAndSaveScore(employeeId);
      console.log(` [Event-Listener] Score mis à jour suite à la modification.`);
    } catch (error) {
      console.error(` [Event-Listener] Erreur lors de la mise à jour du score (Update) :`, error.message);
    }
  }

  /**
   * 3. Écouteur déclenché APRÈS la suppression d'une certification
   * But : Recalculer le score de l'employé en arrière-plan
   */
  @OnEvent('certification.deleted')
  async handleCertificationDeleted(payload: CertificationEventPayload) {
    const { employeeId, certId } = payload;
    console.log(`[Event-Listener] Certification ID: ${certId} supprimée. Recalcul du score...`);

    try {
      await this.scoringService.calculateAndSaveScore(employeeId);
      console.log(` [Event-Listener] Score mis à jour suite à la suppression.`);
    } catch (error) {
      console.error(` [Event-Listener] Erreur lors de la mise à jour du score (Delete) :`, error.message);
    }
  }
}