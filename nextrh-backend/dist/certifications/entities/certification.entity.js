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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Certification = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const cv_entity_1 = require("../../cvs/entities/cv.entity");
let Certification = class Certification {
};
exports.Certification = Certification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'cert_id' }),
    __metadata("design:type", Number)
], Certification.prototype, "certId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cert_name' }),
    __metadata("design:type", String)
], Certification.prototype, "certName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'provider', nullable: true }),
    __metadata("design:type", String)
], Certification.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'issue_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Certification.prototype, "issueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Certification.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path', nullable: true }),
    __metadata("design:type", String)
], Certification.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', default: 'active' }),
    __metadata("design:type", String)
], Certification.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credential_id', nullable: true }),
    __metadata("design:type", String)
], Certification.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.certifications),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Certification.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], Certification.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cv_entity_1.Cv, (cv) => cv.certifications, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'cvCvId' }),
    __metadata("design:type", cv_entity_1.Cv)
], Certification.prototype, "cv", void 0);
exports.Certification = Certification = __decorate([
    (0, typeorm_1.Entity)('certifications')
], Certification);
//# sourceMappingURL=certification.entity.js.map