'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering agricultural questions in Hindi.
 *
 * - answerAgriculturalQuestion - A function that takes a question as input and returns an answer.
 * - AnswerAgriculturalQuestionInput - The input type for the answerAgriculturalQuestion function.
 * - AnswerAgriculturalQuestionOutput - The return type for the answerAgriculturalQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerAgriculturalQuestionInputSchema = z.object({
  question: z.string().describe('The agricultural question in Hindi.'),
});
export type AnswerAgriculturalQuestionInput = z.infer<
  typeof AnswerAgriculturalQuestionInputSchema
>;

const AnswerAgriculturalQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the agricultural question.'),
});
export type AnswerAgriculturalQuestionOutput = z.infer<
  typeof AnswerAgriculturalQuestionOutputSchema
>;

export async function answerAgriculturalQuestion(
  input: AnswerAgriculturalQuestionInput
): Promise<AnswerAgriculturalQuestionOutput> {
  return answerAgriculturalQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerAgriculturalQuestionPrompt',
  input: {schema: AnswerAgriculturalQuestionInputSchema},
  output: {schema: AnswerAgriculturalQuestionOutputSchema},
  prompt: `You are an expert agricultural advisor. A farmer will ask you a question in Hindi, and you will respond in Hindi with helpful advice.

Question: {{{question}}}`,
});

const answerAgriculturalQuestionFlow = ai.defineFlow(
  {
    name: 'answerAgriculturalQuestionFlow',
    inputSchema: AnswerAgriculturalQuestionInputSchema,
    outputSchema: AnswerAgriculturalQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
