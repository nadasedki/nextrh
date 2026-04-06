"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEducationDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_education_dto_1 = require("./create-education.dto");
class UpdateEducationDto extends (0, mapped_types_1.PartialType)(create_education_dto_1.CreateEducationDto) {
}
exports.UpdateEducationDto = UpdateEducationDto;
//# sourceMappingURL=update-education.dto.js.map