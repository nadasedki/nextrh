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
exports.Cv = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const education_entity_1 = require("../../education/entities/education.entity");
const project_entity_1 = require("../../project/entities/project.entity");
const experience_entity_1 = require("../../experience/entities/experience.entity");
const certification_entity_1 = require("../../certifications/entities/certification.entity");
let Cv = class Cv {
};
exports.Cv = Cv;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Cv.prototype, "cv_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Cv.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Cv.prototype, "file_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Cv.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Cv.prototype, "generated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], Cv.prototype, "last_updated", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Cv.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Cv.prototype, "profession", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Cv.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Cv.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Cv.prototype, "fax", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Cv.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array", { nullable: true }),
    __metadata("design:type", Array)
], Cv.prototype, "skills", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => education_entity_1.Education, (education) => education.cv, { cascade: true }),
    __metadata("design:type", Array)
], Cv.prototype, "educations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => project_entity_1.Project, (project) => project.cv, { cascade: true }),
    __metadata("design:type", Array)
], Cv.prototype, "projects", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => experience_entity_1.Experience, (experience) => experience.cv, { cascade: true }),
    __metadata("design:type", Array)
], Cv.prototype, "experiences", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => certification_entity_1.Certification, (certification) => certification.cv, { cascade: true }),
    __metadata("design:type", Array)
], Cv.prototype, "certifications", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Cv.prototype, "user", void 0);
exports.Cv = Cv = __decorate([
    (0, typeorm_1.Entity)('cvs')
], Cv);
//# sourceMappingURL=cv.entity.js.map