import { EducationService } from './education.service';
import { CreateEducationDto } from './dto/create-education.dto';
export declare class EducationController {
    private readonly educationService;
    constructor(educationService: EducationService);
    create(createEducationDto: CreateEducationDto): Promise<import("./entities/education.entity").Education>;
}
