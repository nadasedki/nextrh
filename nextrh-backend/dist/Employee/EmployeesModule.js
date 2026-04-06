"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const employees_controller_1 = require("./employees.controller");
const employees_service_1 = require("./employees.service");
const user_entity_1 = require("../users/entities/user.entity");
const project_entity_1 = require("../project/entities/project.entity");
const training_entity_1 = require("../training/entities/training.entity");
const certification_entity_1 = require("../certifications/entities/certification.entity");
const cv_entity_1 = require("../cvs/entities/cv.entity");
const user_skill_entity_1 = require("../skill/entities/user-skill.entity");
const team_entity_1 = require("../users/entities/team.entity");
let EmployeesModule = class EmployeesModule {
};
exports.EmployeesModule = EmployeesModule;
exports.EmployeesModule = EmployeesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                project_entity_1.Project,
                training_entity_1.Training,
                certification_entity_1.Certification,
                cv_entity_1.Cv,
                user_skill_entity_1.UserSkill,
                team_entity_1.Team
            ]),
        ],
        controllers: [employees_controller_1.EmployeesController],
        providers: [employees_service_1.EmployeesService],
        exports: [employees_service_1.EmployeesService],
    })
], EmployeesModule);
//# sourceMappingURL=EmployeesModule.js.map