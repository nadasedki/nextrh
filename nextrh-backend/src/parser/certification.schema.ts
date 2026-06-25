import { z } from 'zod';

export const CertificationSchema = z.object({
  certificate_name: z
    .string()
    .describe("Nom exact de la certification (ex: CCNP Security)"),

  certificate_holder: z
    .string()
    .describe("Nom de la personne qui a obtenu la certification"),

  provider: z
    .string()
    .describe("Organisme certificateur (ex: Cisco, Microsoft, Dell)"),

  date_of_obtention: z
    .string()
    .describe("Date d'obtention telle qu'écrite dans le document (ex: Jan 2020)"),

  date_of_expiration: z
    .string()
    .nullable()
    .describe("Date d'expiration si disponible, sinon null"),
});