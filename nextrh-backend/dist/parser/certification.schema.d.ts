import { z } from 'zod';
export declare const CertificationSchema: z.ZodObject<{
    certificate_name: z.ZodString;
    certificate_holder: z.ZodString;
    provider: z.ZodString;
    date_of_obtention: z.ZodString;
    date_of_expiration: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
