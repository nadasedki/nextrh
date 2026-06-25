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
export declare class CertificationsListener {
    private readonly userRepo;
    private readonly googleCalendarService;
    private readonly scoringService;
    constructor(userRepo: Repository<User>, googleCalendarService: GoogleCalendarService, scoringService: ScoringService);
    handleCertificationSaved(payload: CertificationSavedPayload): Promise<void>;
    handleCertificationUpdated(payload: CertificationEventPayload): Promise<void>;
    handleCertificationDeleted(payload: CertificationEventPayload): Promise<void>;
}
export {};
