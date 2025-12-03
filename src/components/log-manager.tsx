'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LogEntry } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import LogControls from '@/components/log-controls';
import LogViewer from '@/components/log-viewer';
import { summarizeLogsAction, interpretLogErrorAction } from '@/app/actions';
import AiSummaryDialog from './ai-summary-dialog';
import AiInterpretationDialog from './ai-interpretation-dialog';
import { useToast } from '@/hooks/use-toast';

export default function LogManager() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logTitle, setLogTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiInterpretation, setAiInterpretation] = useState<{ interpretation: string, possibleSolutions: string } | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isInterpretationLoading, setIsInterpretationLoading] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isInterpretationOpen, setIsInterpretationOpen] = useState(false);
  
  const { toast } = useToast();

  const handleSummarize = async () => {
    setIsSummaryLoading(true);
    setIsSummaryOpen(true);
    const result = await summarizeLogsAction(logs);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSummaryOpen(false);
    } else if (result.summary) {
      setAiSummary(result.summary);
    }
    setIsSummaryLoading(false);
  };

  const handleInterpret = async (logMessage: string) => {
    setIsInterpretationLoading(true);
    setIsInterpretationOpen(true);
    setAiInterpretation(null);
    const result = await interpretLogErrorAction(logMessage);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsInterpretationOpen(false);
    } else if (result.interpretation && result.possibleSolutions) {
      setAiInterpretation({ interpretation: result.interpretation, possibleSolutions: result.possibleSolutions });
    }
    setIsInterpretationLoading(false);
  };

  return (
    <div className="space-y-8">
      <LogControls 
        setLogs={setLogs} 
        setLogTitle={setLogTitle}
        setIsLoading={setIsLoading} 
        setError={setError}
        isLoading={isLoading}
      />
      
      <AnimatePresence>
        {(isLoading || error || logs.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <LogViewer 
                  logs={logs} 
                  title={logTitle}
                  isLoading={isLoading} 
                  error={error} 
                  onSummarize={handleSummarize}
                  onInterpret={handleInterpret}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AiSummaryDialog
        isOpen={isSummaryOpen}
        setIsOpen={setIsSummaryOpen}
        summary={aiSummary}
        isLoading={isSummaryLoading}
      />

      <AiInterpretationDialog
        isOpen={isInterpretationOpen}
        setIsOpen={setIsInterpretationOpen}
        interpretationResult={aiInterpretation}
        isLoading={isInterpretationLoading}
      />
    </div>
  );
}
