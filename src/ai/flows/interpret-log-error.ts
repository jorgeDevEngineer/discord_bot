'use server';

/**
 * @fileOverview A flow to interpret error messages in Railway deployment logs and provide possible solutions.
 *
 * - interpretLogError - A function that handles the error interpretation process.
 * - InterpretLogErrorInput - The input type for the interpretLogError function.
 * - InterpretLogErrorOutput - The return type for the interpretLogError function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretLogErrorInputSchema = z.object({
  logMessage: z.string().describe('The error message from the Railway deployment logs.'),
});
export type InterpretLogErrorInput = z.infer<typeof InterpretLogErrorInputSchema>;

const InterpretLogErrorOutputSchema = z.object({
  interpretation: z.string().describe('A human-readable interpretation of the error message.'),
  possibleSolutions: z
    .string()
    .describe('Possible solutions to resolve the error, based on the interpretation.'),
});
export type InterpretLogErrorOutput = z.infer<typeof InterpretLogErrorOutputSchema>;

export async function interpretLogError(input: InterpretLogErrorInput): Promise<InterpretLogErrorOutput> {
  return interpretLogErrorFlow(input);
}

const interpretLogErrorPrompt = ai.definePrompt({
  name: 'interpretLogErrorPrompt',
  input: {schema: InterpretLogErrorInputSchema},
  output: {schema: InterpretLogErrorOutputSchema},
  prompt: `You are an expert in debugging Railway deployments. Given an error message from the logs, your task is to provide a clear interpretation of the error and suggest possible solutions.

Error Message: {{{logMessage}}}

Interpretation and Solutions:`,
});

const interpretLogErrorFlow = ai.defineFlow(
  {
    name: 'interpretLogErrorFlow',
    inputSchema: InterpretLogErrorInputSchema,
    outputSchema: InterpretLogErrorOutputSchema,
  },
  async input => {
    const {output} = await interpretLogErrorPrompt(input);
    return output!;
  }
);
