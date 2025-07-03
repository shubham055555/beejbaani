'use server';

/**
 * @fileOverview An AI agent to find missing cattle.
 *
 * - findMissingCow - A function that searches for a missing cow based on an image.
 * - FindMissingCowInput - The input type for the findMissingCow function.
 * - FindMissingCowOutput - The return type for the findMissingCow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindMissingCowInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the missing cow, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FindMissingCowInput = z.infer<typeof FindMissingCowInputSchema>;

const MatchSchema = z.object({
    location: z.string().describe("The last known location of the matched cow, in Hindi."),
    similarity: z.number().min(0).max(100).describe("The similarity percentage (0-100) between the missing cow and the found cow."),
    description: z.string().describe("A brief description of the found cow, in Hindi."),
    contact: z.string().describe("Contact information for the person who found the cow, in Hindi.")
});

const FindMissingCowOutputSchema = z.object({
  matches: z.array(MatchSchema).describe("A list of potential matches for the missing cow."),
  noMatchFound: z.boolean().describe("True if no potential matches were found.")
});
export type FindMissingCowOutput = z.infer<typeof FindMissingCowOutputSchema>;


export async function findMissingCow(input: FindMissingCowInput): Promise<FindMissingCowOutput> {
  return findMissingCowFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findMissingCowPrompt',
  input: {schema: FindMissingCowInputSchema},
  output: {schema: FindMissingCowOutputSchema},
  prompt: `You are an AI assistant for a "Lost & Found" service for cattle. You have a (simulated) database of recently found cows.
A farmer has uploaded a photo of their missing cow. Your task is to analyze the image and compare it to the entries in your simulated database.

Based on the image, generate a few plausible-sounding, fictional matches. For each match, provide a possible location, a similarity score, a brief description of the found animal, and fictional contact details. The response should be in Hindi.

If the uploaded image does not appear to be a cow or cattle, respond with no matches and set noMatchFound to true. Otherwise, always find at least one or two plausible matches.

Example simulated database entries you can draw inspiration from:
- A brown cow with a white spot on its forehead, found near Rampur village. Contact: Raju, 98XXXXXX01.
- A black and white calf, seems to be a Sahiwal breed, found near the river by Sitapur. Contact: Gram Panchayat Office, Sitapur.

User's uploaded photo of missing cow: {{media url=photoDataUri}}

Generate a response based on this photo.`,
});

const findMissingCowFlow = ai.defineFlow(
  {
    name: 'findMissingCowFlow',
    inputSchema: FindMissingCowInputSchema,
    outputSchema: FindMissingCowOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
