import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground',
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  async createTestEvent() {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Formatage des dates pour Google (ISO String)
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 3600000);

    const event = {
      summary: 'Test  : Alerte Expiration ',
      description: 'Ceci est un test automatique envoyé depuis le backend NestJS.',
      start: {
        dateTime: now.toISOString(),
        timeZone: 'Africa/Tunis',
      },
      end: {
        dateTime: inOneHour.toISOString(),
        timeZone: 'Africa/Tunis',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // Email 1 jour avant
          { method: 'popup', minutes: 10 },      // Notification 10 min avant
        ],
      },
    };

    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      console.log(' Événement créé :', res.data.htmlLink);
      return { 
        success: true, 
        link: res.data.htmlLink,
        message: 'L\'événement a été ajouté à votre Google Agenda.' 
      };
    } catch (error) {
      console.error('Erreur Google Calendar:', error.response?.data || error.message);
      throw new InternalServerErrorException('Impossible de créer l\'événement Google');
    }
  }


  async createExpirationEvent(candidateName: string, candidateEmail: string, certName: string) {
  const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

  // POUR LE TEST : On crée l'événement dans 2 minutes pour recevoir le rappel "0 minutes avant"
  const startTime = new Date(Date.now() + 120000); // Maintenant + 2 minutes
  const endTime = new Date(startTime.getTime() + 3600000); // + 1 heure

  const event = {
    summary: `⚠️ Expiration : ${certName}`,
    description: `Bonjour ${candidateName}, ceci est une notification pour le renouvellement de votre certification ${certName}.`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Africa/Tunis',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Africa/Tunis',
    },
    //  :le candidat ici pour qu'il reçoive l'e-mail d'invitation
    attendees: [
      { email: candidateEmail } 
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 0 }, // Envoi d'un e-mail à l'heure exacte du début
        { method: 'popup', minutes: 1 },  // Notification écran 1 minute avant
      ],
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all', //  pour envoyer les e-mails d'invitation
    });

    return { success: true, link: res.data.htmlLink };
  } catch (error) {
    throw error;
  }
}



async scheduleEmployeeReminder(
  employeeName: string,
  employeeEmail: string,
  certName: string,
  expiryDateStr: string,
) {
  const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

  // 1. Calcul de la DATE D'ALERTE (Date d'expiration - 60 jours)
  const expiryDate = new Date(expiryDateStr);
  const alertDate = new Date(expiryDate);
  alertDate.setDate(alertDate.getDate() - 60);

  // Vérification : si l'alerte est déjà passée, on la met à "maintenant"
  const now = new Date();
  if (alertDate < now) {
    alertDate.setTime(now.getTime() + 1 * 60000); // Dans 10 minutes
  } else {
    alertDate.setHours(9, 0, 0); // À 09h00 du matin le jour J-60
  }

  // 2. Création de l'événement DIRECTEMENT à la date d'alerte
   const event = {
    // 1. On ajoute [A_ENVOYER] pour que n8n le reconnaisse
    summary: `[A_ENVOYER] Expiration ${certName} : ${employeeName}`,
    
    // 2. On met l'email de l'employé dans la "Description" 
    // pour que n8n puisse le lire facilement
    description: `EMAIL_EMPLOYE:${employeeEmail}
                  NOM_EMPLOYE:${employeeName}
                  CERTIFICAT:${certName},
                  DATE_EXPIRATION:${expiryDateStr}`,
    
    start: { dateTime: alertDate.toISOString(), timeZone: 'Africa/Tunis' },
    end: { dateTime: new Date(alertDate.getTime() + 3600000).toISOString(), timeZone: 'Africa/Tunis' },
    
    // On ne met PAS d'invité (attendees) ici, car c'est n8n qui enverra le mail personnalisé
    reminders: { useDefault: true }, 
  };
  
  return await calendar.events.insert({ calendarId: 'primary', requestBody: event });
}

}


