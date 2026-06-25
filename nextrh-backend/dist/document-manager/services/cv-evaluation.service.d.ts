import { CvParserFacade } from './cv-parser.facade';
export declare class CvEvaluationService {
    private readonly cvParserFacade;
    private readonly logger;
    private readonly SIMILARITY_THRESHOLD;
    constructor(cvParserFacade: CvParserFacade);
    runAcademicEvaluation(): Promise<any>;
    private computeTextSoftScores;
    private computeArraySoftScores;
    private computeObjectArraySoftScores;
    private calculateSimilarity;
    private calculateFinalMatrix;
}
