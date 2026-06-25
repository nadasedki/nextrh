"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationSchema = void 0;
const zod_1 = require("zod");
exports.CertificationSchema = zod_1.z.object({
    certificate_name: zod_1.z
        .string()
        .describe("Nom exact de la certification (ex: CCNP Security)"),
    certificate_holder: zod_1.z
        .string()
        .describe("Nom de la personne qui a obtenu la certification"),
    provider: zod_1.z
        .string()
        .describe("Organisme certificateur (ex: Cisco, Microsoft, Dell)"),
    date_of_obtention: zod_1.z
        .string()
        .describe("Date d'obtention telle qu'écrite dans le document (ex: Jan 2020)"),
    date_of_expiration: zod_1.z
        .string()
        .nullable()
        .describe("Date d'expiration si disponible, sinon null"),
});
//# sourceMappingURL=certification.schema.js.map