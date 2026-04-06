import { GoogleCalendarService } from './google-calendar.service';
export declare class GoogleCalendarController {
    private readonly calendarService;
    constructor(calendarService: GoogleCalendarService);
    testCalendar(): Promise<{
        success: boolean;
        link: string;
        message: string;
    }>;
    testEmail(): Promise<{
        success: boolean;
        link: string;
    }>;
}
