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
}
