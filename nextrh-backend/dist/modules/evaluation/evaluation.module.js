"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationModule = void 0;
const common_1 = require("@nestjs/common");
const evaluation_service_1 = require("./evaluation.service");
const parser_service_1 = require("../../parser/parser.service");
const llm_service_1 = require("../../parser/llm.service");
let EvaluationModule = class EvaluationModule {
};
exports.EvaluationModule = EvaluationModule;
exports.EvaluationModule = EvaluationModule = __decorate([
    (0, common_1.Module)({
        providers: [evaluation_service_1.EvaluationService, parser_service_1.ParserService, llm_service_1.LlmService],
        exports: [evaluation_service_1.EvaluationService],
    })
], EvaluationModule);
//# sourceMappingURL=evaluation.module.js.map