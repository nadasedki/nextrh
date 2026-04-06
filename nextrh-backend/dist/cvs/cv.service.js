"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cv_entity_1 = require("./entities/cv.entity");
let CvService = class CvService {
    constructor(cvRepository) {
        this.cvRepository = cvRepository;
    }
    async saveIdentityCv(userId, filePath, cvJson) {
        const cv = this.cvRepository.create({
            user_id: userId,
            file_path: filePath,
            format: 'pdf',
            generated: true,
            full_name: cvJson.contact?.name,
            profession: cvJson.contact?.profession,
            email: cvJson.contact?.email,
            phone: cvJson.contact?.phone,
            fax: cvJson.contact?.fax,
            address: cvJson.contact?.address,
        });
        return await this.cvRepository.save(cv);
    }
};
exports.CvService = CvService;
exports.CvService = CvService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cv_entity_1.Cv)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CvService);
//# sourceMappingURL=cv.service.js.map