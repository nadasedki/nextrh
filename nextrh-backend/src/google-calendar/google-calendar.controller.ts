import { Controller, Get } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly calendarService: GoogleCalendarService) {}

  @Get('test')
  async testCalendar() {
    return await this.calendarService.createTestEvent();
  
}
@Get('test-email')
async testEmail() {
  //   EMAIL POUR LE TEST
  return await this.calendarService.createExpirationEvent(
    'Nada Sedki', 
    'nada.sedki@fsb.ucar.tn', // a changer
    'Certification AWS Architect'
  );
}
}