"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var TextSegmentationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextSegmentationService = void 0;
const common_1 = require("@nestjs/common");
const natural = __importStar(require("natural"));
const cv_parser_constants_1 = require("../constants/cv-parser.constants");
const text_cleaning_util_1 = require("../utils/text-cleaning.util");
let TextSegmentationService = TextSegmentationService_1 = class TextSegmentationService {
    constructor() {
        this.logger = new common_1.Logger(TextSegmentationService_1.name);
    }
    segmentText(text) {
        const cleaned = (0, text_cleaning_util_1.cleanRawText)(text);
        const lines = cleaned.split('\n');
        const sections = {
            header: [], experience: [], certification: [], education: [], projects: [], skills: [],
        };
        let currentSection = 'header';
        for (const line of lines) {
            const trimmed = line.trim().toLowerCase();
            if (trimmed.length === 0)
                continue;
            let matched = null;
            if (trimmed.length < 40) {
                outer: for (const [key, synonyms] of Object.entries(cv_parser_constants_1.HEADING_SYNONYMS)) {
                    for (const synonym of synonyms) {
                        if (natural.JaroWinklerDistance(trimmed, synonym) > 0.88) {
                            matched = key;
                            break outer;
                        }
                    }
                }
            }
            if (matched) {
                currentSection = matched;
            }
            else {
                sections[currentSection].push(line);
            }
        }
        const result = {};
        for (const [key, sectionLines] of Object.entries(sections)) {
            result[key] = sectionLines.join('\n').trim();
        }
        return result;
    }
};
exports.TextSegmentationService = TextSegmentationService;
exports.TextSegmentationService = TextSegmentationService = TextSegmentationService_1 = __decorate([
    (0, common_1.Injectable)()
], TextSegmentationService);
//# sourceMappingURL=text-segmentation.service.js.map