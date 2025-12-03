'use server';

import { z } from 'zod';
import { GraphQLClient, gql } from 'graphql-request';
import type { LogEntry } from '@/lib/definitions';
import { summarizeLogs } from '@/ai/flows/summarize-logs';
import { interpretLogError } from '@/ai/flows/interpret-log-error';

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

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*.{0,2}(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

export async function fetchLogs(railwayApiKey: string, serviceId: string, logType: 'deploy' | 'app', limit: number = 50): Promise<{ logs: LogEntry[]; error?: string, title: string }> {
  const graphQLClient = new GraphQLClient(RAILWAY_API_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${railwayApiKey}`,
    },
  });

  try {
    const deployData = await graphQLClient.request<{ deployments: { edges: { node: { id: string, status: string } }[] } }>(GET_LATEST_DEPLOYMENT, {
      serviceId: serviceId,
    });

    const deployment = deployData.deployments.edges[0]?.node;
    if (!deployment) {
      return { logs: [], error: 'No active deployments found.', title: '' };
    }

    const query = logType === 'deploy' ? GET_BUILD_LOGS : GET_DEPLOYMENT_LOGS;
    const logData = await graphQLClient.request<{ [key: string]: LogEntry[] }>(query, {
      deploymentId: deployment.id,
      limit: limit,
    });
    
    const logs = (logType === 'deploy' ? logData.buildLogs : logData.deploymentLogs).map(log => ({
      ...log,
      message: stripAnsiCodes(log.message),
    }));

    const title = `${logType === 'deploy' ? 'Deployment' : 'Application'} Logs for ${deployment.id.slice(0,8)}`;

    return { logs, title };
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
  const logText = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.severity}] ${l.message}`).join('\n');
  
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
