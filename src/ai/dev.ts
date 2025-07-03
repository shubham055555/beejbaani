import { config } from 'dotenv';
config();

import '@/ai/flows/identify-crop-disease.ts';
import '@/ai/flows/get-weather-and-soil-advice.ts';
import '@/ai/flows/answer-agricultural-questions.ts';