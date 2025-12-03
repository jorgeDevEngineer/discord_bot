'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';

type AiSummaryDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  summary: string;
  isLoading: boolean;
};

export default function AiSummaryDialog({ isOpen, setIsOpen, summary, isLoading }: AiSummaryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="text-accent" />
            AI Log Summary
          </DialogTitle>
          <DialogDescription>
            An AI-generated summary of the recent log activity.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 prose prose-invert prose-sm max-w-none">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="text-foreground">{summary}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
