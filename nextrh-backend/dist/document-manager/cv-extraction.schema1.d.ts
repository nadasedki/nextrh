import { z } from 'zod';
export declare const CvExtractionSchema: z.ZodObject<{
    full_name: z.ZodNullable<z.ZodString>;
    profession: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    fax: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    skills: z.ZodArray<z.ZodString>;
    certifications: z.ZodArray<z.ZodObject<{
        cert_name: z.ZodString;
        provider: z.ZodString;
        date: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    experiences: z.ZodArray<z.ZodObject<{
        company: z.ZodString;
        role: z.ZodString;
        period: z.ZodNullable<z.ZodString>;
        description: z.ZodString;
    }, z.core.$strip>>;
    education: z.ZodArray<z.ZodObject<{
        year: z.ZodNullable<z.ZodString>;
        institution: z.ZodString;
        degree: z.ZodString;
    }, z.core.$strip>>;
    projects: z.ZodArray<z.ZodObject<{
        year: z.ZodNullable<z.ZodString>;
        client: z.ZodString;
        description: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CvExtractionResult = z.infer<typeof CvExtractionSchema>;
