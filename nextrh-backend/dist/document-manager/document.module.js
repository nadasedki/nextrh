"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentModule = void 0;
const common_1 = require("@nestjs/common");
const document_controller_1 = require("./controllers/document.controller");
const pdf_parser_service_1 = require("./services/pdf-parser.service");
const cv_heuristic_parser_service_1 = require("./services/cv-heuristic-parser.service");
const cv_parser_facade_1 = require("./services/cv-parser.facade");
const ocr_controller_1 = require("./controllers/ocr.controller");
const ocr_service_1 = require("./services/ocr.service");
const cv_parser_facade2_1 = require("./services/cv-parser.facade2");
const cv_evaluation_service_1 = require("./services/cv-evaluation.service");
let DocumentModule = class DocumentModule {
};
exports.DocumentModule = DocumentModule;
exports.DocumentModule = DocumentModule = __decorate([
    (0, common_1.Module)({
        controllers: [document_controller_1.DocumentController, ocr_controller_1.OcrController],
        providers: [pdf_parser_service_1.PdfParserService, cv_heuristic_parser_service_1.CvHeuristicParserService, cv_parser_facade_1.CvParserFacade, ocr_service_1.OcrService, cv_parser_facade2_1.CvParserFacade2, cv_evaluation_service_1.CvEvaluationService],
        exports: [ocr_service_1.OcrService, cv_parser_facade_1.CvParserFacade],
    })
], DocumentModule);
//# sourceMappingURL=document.module.js.map