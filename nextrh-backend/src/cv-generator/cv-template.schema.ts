import { z } from 'zod';

export const cvTemplateHtmlSchema = z.object({
  html: z.string().describe(
    'The complete, visually matching, compiled-ready HTML/CSS template containing the correct Handlebars loop and field variables.'
  ),
});