"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvGeneratorModule = void 0;
const common_1 = require("@nestjs/common");
const cv_generator_service_1 = require("./cv-generator.service");
const cv_generator_controller_1 = require("./cv-generator.controller");
const cv_module_1 = require("../cvs/cv.module");
let CvGeneratorModule = class CvGeneratorModule {
};
exports.CvGeneratorModule = CvGeneratorModule;
exports.CvGeneratorModule = CvGeneratorModule = __decorate([
    (0, common_1.Module)({
        imports: [cv_module_1.CvModule],
        providers: [cv_generator_service_1.CvGeneratorService],
        controllers: [cv_generator_controller_1.CvGeneratorController]
    })
], CvGeneratorModule);
//# sourceMappingURL=cv-generator.module.js.map