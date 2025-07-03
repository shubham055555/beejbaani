'use server';

/**
 * @fileOverview An AI agent to answer questions about an image in an agricultural context.
 *
 * - analyzeImageWithQuestion - A function that handles answering a question about an image.
 * - AnalyzeImageWithQuestionInput - The input type for the analyzeImageWithQuestion function.
 * - AnalyzeImageWithQuestionOutput - The return type for the analyzeImageWithQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageWithQuestionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question about the image, in Hindi.'),
});
export type AnalyzeImageWithQuestionInput = z.infer<typeof AnalyzeImageWithQuestionInputSchema>;

const AnalyzeImageWithQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the image, in Hindi.'),
});
export type AnalyzeImageWithQuestionOutput = z.infer<
  typeof AnalyzeImageWithQuestionOutputSchema
>;

export async function analyzeImageWithQuestion(
  input: AnalyzeImageWithQuestionInput
): Promise<AnalyzeImageWithQuestionOutput> {
  return analyzeImageWithQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImageWithQuestionPrompt',
  input: {schema: AnalyzeImageWithQuestionInputSchema},
  output: {schema: AnalyzeImageWithQuestionOutputSchema},
  prompt: `You are an expert agricultural advisor. A user has uploaded an image and asked a question about it. Provide a helpful and detailed answer in Hindi.

Your expertise includes identifying crop diseases, suggesting treatments, recognizing livestock, and providing general farming advice.

Analyze the image and the user's question to give the best possible response.

Image: {{media url=photoDataUri}}
Question: {{{question}}}`,
});

const analyzeImageWithQuestionFlow = ai.defineFlow(
  {
    name: 'analyzeImageWithQuestionFlow',
    inputSchema: AnalyzeImageWithQuestionInputSchema,
    outputSchema: AnalyzeImageWithQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
