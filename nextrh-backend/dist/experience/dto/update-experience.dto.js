"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateExperienceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_experience_dto_1 = require("./create-experience.dto");
class UpdateExperienceDto extends (0, mapped_types_1.PartialType)(create_experience_dto_1.CreateExperienceDto) {
}
exports.UpdateExperienceDto = UpdateExperienceDto;
//# sourceMappingURL=update-experience.dto.js.map