import { FormattedCandidateData } from './candidate-data.types';
import { EmployeeProfileService } from '../Employee/employeeProfile.service';
export declare class CvDataFormatterService {
    private readonly employeeService;
    constructor(employeeService: EmployeeProfileService);
    getFormattedCandidateData(userId: number): Promise<FormattedCandidateData>;
    private format;
    private formatDate;
    private formatPeriod;
    private formatDateYearOnly;
    private formatPeriodYearsOnly;
}
