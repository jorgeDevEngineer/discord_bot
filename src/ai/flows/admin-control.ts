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
  message: z.object({
    member: z.object({
      roles: z.object({
        cache: z.any(),
      }),
    }),
    content: z.string(),
  }).describe('The Discord message object.'),
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

const checkAdminRoleTool = ai.defineTool({
  name: 'checkAdminRole',
  description: 'Checks if the user has the required admin role to access logs.',
  inputSchema: AdminControlInputSchema,
  outputSchema: AdminControlOutputSchema,
}, async (input) => {
  const hasPermission = input.message.member.roles.cache.has(input.adminRoleId);
  return { hasPermission };
});

const adminControlPrompt = ai.definePrompt({
  name: 'adminControlPrompt',
  tools: [checkAdminRoleTool],
  input: {schema: AdminControlInputSchema},
  output: {schema: AdminControlOutputSchema},
  prompt: `Determine if the user has permission to access logs based on their Discord role. Use the checkAdminRole tool to check if the user has the required role.
Message Content: {{{message.content}}}
Admin Role ID: {{{adminRoleId}}}`,  
});


const adminControlFlow = ai.defineFlow(
  {
    name: 'adminControlFlow',
    inputSchema: AdminControlInputSchema,
    outputSchema: AdminControlOutputSchema,
  },
  async input => {
    const {output} = await adminControlPrompt(input);
    return output!;
  }
);
