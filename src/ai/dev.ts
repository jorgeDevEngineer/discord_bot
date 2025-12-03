import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-logs.ts';
import '@/ai/flows/interpret-log-error.ts';
