'use server';
/**
 * @fileOverview A weather and soil advice AI agent.
 *
 * - getWeatherAndSoilAdvice - A function that provides weather forecasts and soil-based advice in Hindi.
 * - WeatherAndSoilAdviceInput - The input type for the getWeatherAndSoilAdvice function.
 * - WeatherAndSoilAdviceOutput - The return type for the getWeatherAndSoilAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherAndSoilAdviceInputSchema = z.object({
  region: z.string().describe('The region for which weather and soil advice is requested.'),
  crop: z.string().describe('The crop being grown.'),
});
export type WeatherAndSoilAdviceInput = z.infer<typeof WeatherAndSoilAdviceInputSchema>;

const WeatherAndSoilAdviceOutputSchema = z.object({
  weatherForecast: z.string().describe('The weather forecast for the region, in Hindi.'),
  soilAdvice: z.string().describe('Soil-based advice for the region and crop, in Hindi.'),
});
export type WeatherAndSoilAdviceOutput = z.infer<typeof WeatherAndSoilAdviceOutputSchema>;

export async function getWeatherAndSoilAdvice(input: WeatherAndSoilAdviceInput): Promise<WeatherAndSoilAdviceOutput> {
  return getWeatherAndSoilAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWeatherAndSoilAdvicePrompt',
  input: {schema: WeatherAndSoilAdviceInputSchema},
  output: {schema: WeatherAndSoilAdviceOutputSchema},
  prompt: `You are an agricultural expert providing weather forecasts and soil-based advice in Hindi.

  Provide a weather forecast and soil-based advice for the following region and crop, in Hindi.

  Region: {{{region}}}
  Crop: {{{crop}}}

  Format your response in Hindi.`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const getWeatherAndSoilAdviceFlow = ai.defineFlow(
  {
    name: 'getWeatherAndSoilAdviceFlow',
    inputSchema: WeatherAndSoilAdviceInputSchema,
    outputSchema: WeatherAndSoilAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
