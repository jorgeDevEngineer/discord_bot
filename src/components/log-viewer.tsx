import type { LogEntry } from '@/lib/definitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bot, Sparkles } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type LogViewerProps = {
  logs: LogEntry[];
  title: string;
  isLoading: boolean;
  error: string | null;
  onSummarize: () => void;
  onInterpret: (logMessage: string) => void;
};

const LogLine = ({ log, onInterpret }: { log: LogEntry, onInterpret: (logMessage: string) => void; }) => {
  const severityColor = {
    'INFO': 'text-blue-400',
    'WARN': 'text-yellow-400',
    'ERROR': 'text-red-400',
    'DEBUG': 'text-gray-400',
  }[log.severity] || 'text-gray-400';

  return (
    <div className="group flex items-start gap-4 text-sm font-mono hover:bg-muted/50 px-4 py-2 transition-colors">
      <time className="text-muted-foreground whitespace-nowrap tabular-nums">
        {new Date(log.timestamp).toLocaleTimeString()}
      </time>
      <span className={`font-bold w-14 ${severityColor}`}>{log.severity}</span>
      <p className="flex-1 break-words whitespace-pre-wrap">{log.message}</p>
      {log.severity === 'ERROR' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onInterpret(log.message)}>
                <Sparkles className="h-4 w-4 text-accent" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Interpret Error with AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default function LogViewer({ logs, title, isLoading, error, onSummarize, onInterpret }: LogViewerProps) {
  if (isLoading) {
    return (
      <div>
        <CardHeader>
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </CardHeader>
        <div className="p-4 space-y-3">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive">An Error Occurred</h3>
        <p className="text-muted-foreground max-w-md">{error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
        <div className="p-8 flex flex-col items-center justify-center text-center">
            <CardHeader>
                <CardTitle>No Logs</CardTitle>
                <CardDescription>Fetch logs using the controls above.</CardDescription>
            </CardHeader>
        </div>
    );
  }

  return (
    <div>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Displaying last {logs.length} log entries.</CardDescription>
        </div>
        <Button variant="outline" onClick={onSummarize}>
            <Bot className="mr-2" />
            Summarize with AI
        </Button>
      </CardHeader>
      <Separator />
      <ScrollArea className="h-96">
        <div className="py-2">
            {logs.map((log, i) => <LogLine key={i} log={log} onInterpret={onInterpret}/>)}
        </div>
      </ScrollArea>
    </div>
  );
}
