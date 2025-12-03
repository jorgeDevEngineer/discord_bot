'use server';

import { z } from 'zod';
import { GraphQLClient, gql } from 'graphql-request';
import type { LogEntry } from '@/lib/definitions';
import { summarizeLogs } from '@/ai/flows/summarize-logs';
import { interpretLogError } from '@/ai/flows/interpret-log-error';

const FormSchema = z.object({
  railwayApiKey: z.string().min(1, 'Railway API Token is required.'),
  serviceId: z.string().min(1, 'Service ID is required.'),
  password: z.string().min(1, 'Password is required.'),
});

type FormValues = z.infer<typeof FormSchema>;

const RAILWAY_API_ENDPOINT = 'https://backboard.railway.app/graphql/v2';

const GET_LATEST_DEPLOYMENT = gql`
  query GetDeployments($serviceId: String!) {
    deployments(first: 1, input: { serviceId: $serviceId }) {
      edges {
        node {
          id
          status
        }
      }
    }
  }
`;

const GET_DEPLOYMENT_LOGS = gql`
  query GetLogs($deploymentId: String!, $limit: Int) {
    deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
      message
      severity
      timestamp
    }
  }
`;

const GET_BUILD_LOGS = gql`
  query GetBuildLogs($deploymentId: String!, $limit: Int) {
    buildLogs(deploymentId: $deploymentId, limit: $limit) {
      message
      severity
      timestamp
    }
  }
`;

export async function fetchLogsAction(values: FormValues, logType: 'deploy' | 'app'): Promise<{ logs: LogEntry[]; error?: string, title: string }> {
  const validation = FormSchema.safeParse(values);
  if (!validation.success) {
    return { logs: [], error: 'Invalid input.', title: '' };
  }
  
  if (values.password !== process.env.APP_PASSWORD) {
    return { logs: [], error: 'Invalid password.', title: '' };
  }

  const graphQLClient = new GraphQLClient(RAILWAY_API_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${values.railwayApiKey}`,
    },
  });

  try {
    const deployData = await graphQLClient.request<{ deployments: { edges: { node: { id: string, status: string } }[] } }>(GET_LATEST_DEPLOYMENT, {
      serviceId: values.serviceId,
    });

    const deployment = deployData.deployments.edges[0]?.node;
    if (!deployment) {
      return { logs: [], error: 'No active deployments found.', title: '' };
    }

    const query = logType === 'deploy' ? GET_BUILD_LOGS : GET_DEPLOYMENT_LOGS;
    const logData = await graphQLClient.request<{ [key: string]: LogEntry[] }>(query, {
      deploymentId: deployment.id,
      limit: 100, // Fetch last 100 logs
    });
    
    const logs = logType === 'deploy' ? logData.buildLogs : logData.deploymentLogs;
    const title = `${logType === 'deploy' ? 'Deployment' : 'Application'} Logs for ${deployment.id}`;

    return { logs: logs.slice(-100), title };
  } catch (error: any) {
    console.error(error);
    if (error.response?.errors?.length > 0) {
      return { logs: [], error: `GraphQL Error: ${error.response.errors[0].message}`, title: '' };
    }
    return { logs: [], error: `Failed to fetch logs: ${error.message}`, title: '' };
  }
}

export async function summarizeLogsAction(logs: LogEntry[]) {
  if (!logs || logs.length === 0) {
    return { error: 'No logs to summarize.' };
  }
  const logText = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.message}`).join('\n');
  
  try {
    const result = await summarizeLogs({ logs: logText });
    return { summary: result.summary };
  } catch (error: any) {
    return { error: `AI summarization failed: ${error.message}` };
  }
}

export async function interpretLogErrorAction(logMessage: string) {
  if (!logMessage) {
    return { error: 'No log message to interpret.' };
  }
  
  try {
    const result = await interpretLogError({ logMessage });
    return { interpretation: result.interpretation, possibleSolutions: result.possibleSolutions };
  } catch (error: any) {
    return { error: `AI interpretation failed: ${error.message}` };
  }
}
