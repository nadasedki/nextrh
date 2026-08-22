"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cvTemplateHtmlSchema = void 0;
const zod_1 = require("zod");
exports.cvTemplateHtmlSchema = zod_1.z.object({
    html: zod_1.z.string().describe('The complete, visually matching, compiled-ready HTML/CSS template containing the correct Handlebars loop and field variables.'),
});
//# sourceMappingURL=cv-template.schema.js.map