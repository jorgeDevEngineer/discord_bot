'use server';

/**
 * @fileOverview Summarizes logs from a Railway deployment.
 *
 * - summarizeLogs - A function that summarizes the logs of a Railway deployment.
 * - SummarizeLogsInput - The input type for the summarizeLogs function.
 * - SummarizeLogsOutput - The return type for the summarizeLogs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLogsInputSchema = z.object({
  logs: z
    .string()
    .describe('The logs to summarize.'),
});
export type SummarizeLogsInput = z.infer<typeof SummarizeLogsInputSchema>;

const SummarizeLogsOutputSchema = z.object({
  summary: z.string().describe('A summary of the logs.'),
});
export type SummarizeLogsOutput = z.infer<typeof SummarizeLogsOutputSchema>;

export async function summarizeLogs(input: SummarizeLogsInput): Promise<SummarizeLogsOutput> {
  return summarizeLogsFlow(input);
}

const summarizeLogsPrompt = ai.definePrompt({
  name: 'summarizeLogsPrompt',
  input: {schema: SummarizeLogsInputSchema},
  output: {schema: SummarizeLogsOutputSchema},
  prompt: `Eres un experto en resumir logs de despliegues de Railway. Tu respuesta debe ser siempre en español.

  Resume los siguientes logs, destacando los eventos y problemas clave:

  Logs: {{{logs}}}`,
});

const summarizeLogsFlow = ai.defineFlow(
  {
    name: 'summarizeLogsFlow',
    inputSchema: SummarizeLogsInputSchema,
    outputSchema: SummarizeLogsOutputSchema,
  },
  async input => {
    const {output} = await summarizeLogsPrompt(input);
    return output!;
  }
);
