export declare class GoogleCalendarService {
    private oauth2Client;
    constructor();
    createTestEvent(): Promise<{
        success: boolean;
        link: string;
        message: string;
    }>;
    createExpirationEvent(candidateName: string, candidateEmail: string, certName: string): Promise<{
        success: boolean;
        link: string;
    }>;
    scheduleEmployeeReminder(employeeName: string, employeeEmail: string, certName: string, expiryDateStr: string): Promise<import("googleapis-common").GaxiosResponseWithHTTP2<import("googleapis").calendar_v3.Schema$Event>>;
}
