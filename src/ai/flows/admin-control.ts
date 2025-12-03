'use server';

/**
 * @fileOverview Flow for admin control to authorize users to access logs based on Discord role.
 *
 * - checkAdminRole - Checks if the user has the required admin role to access logs.
 * - AdminControlInput - The input type for the checkAdminRole function.
 * - AdminControlOutput - The return type for the checkAdminRole function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminControlInputSchema = z.object({
  // Using 'any' for the message object because discord.js types are complex
  // and not easily serializable for Genkit/Zod.
  message: z.any().describe('The Discord message object.'),
  adminRoleId: z.string().describe('The Discord role ID required to access logs.'),
});
export type AdminControlInput = z.infer<typeof AdminControlInputSchema>;

const AdminControlOutputSchema = z.object({
  hasPermission: z.boolean().describe('Whether the user has permission to access logs.'),
});
export type AdminControlOutput = z.infer<typeof AdminControlOutputSchema>;

export async function checkAdminRole(input: AdminControlInput): Promise<AdminControlOutput> {
  return adminControlFlow(input);
}

const adminControlFlow = ai.defineFlow(
  {
    name: 'adminControlFlow',
    inputSchema: AdminControlInputSchema,
    outputSchema: AdminControlOutputSchema,
  },
  async (input) => {
    // The logic is simple enough to be handled directly in the flow.
    // A tool is overkill here.
    const hasPermission = input.message.member.roles.cache.has(input.adminRoleId);
    return { hasPermission };
  }
);
