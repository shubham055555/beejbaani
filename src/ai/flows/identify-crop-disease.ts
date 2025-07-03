'use server';

/**
 * @fileOverview An AI agent to identify crop diseases from an image.
 *
 * - identifyCropDisease - A function that handles the crop disease identification process.
 * - IdentifyCropDiseaseInput - The input type for the identifyCropDisease function.
 * - IdentifyCropDiseaseOutput - The return type for the identifyCropDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyCropDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyCropDiseaseInput = z.infer<typeof IdentifyCropDiseaseInputSchema>;

const IdentifyCropDiseaseOutputSchema = z.object({
  diseaseIdentification: z.object({
    diseaseDetected: z.boolean().describe('Whether or not a disease is detected on the plant.'),
    likelyDiseases: z.array(z.string()).describe('The list of likely diseases that the plant has.'),
    confidenceLevels: z
      .array(z.number())
      .describe('The confidence levels for each likely disease.'),
  }),
  recommendations: z.string().describe('Recommendations for treating the disease(s).'),
});

export type IdentifyCropDiseaseOutput = z.infer<typeof IdentifyCropDiseaseOutputSchema>;

export async function identifyCropDisease(input: IdentifyCropDiseaseInput): Promise<IdentifyCropDiseaseOutput> {
  return identifyCropDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyCropDiseasePrompt',
  input: {schema: IdentifyCropDiseaseInputSchema},
  output: {schema: IdentifyCropDiseaseOutputSchema},
  prompt: `You are an expert in plant pathology. A farmer has uploaded an image of a plant, and your task is to identify any potential diseases and provide recommendations for treatment.

  Analyze the following image to determine if there are any diseases present. If diseases are detected, provide a list of likely diseases along with confidence levels, and suggest appropriate treatment recommendations.

  Image: {{media url=photoDataUri}}`,
});

const identifyCropDiseaseFlow = ai.defineFlow(
  {
    name: 'identifyCropDiseaseFlow',
    inputSchema: IdentifyCropDiseaseInputSchema,
    outputSchema: IdentifyCropDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
