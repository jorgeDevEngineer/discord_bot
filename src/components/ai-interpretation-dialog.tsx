'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Lightbulb } from 'lucide-react';
import { Separator } from './ui/separator';

type AiInterpretationDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  interpretationResult: { interpretation: string; possibleSolutions: string } | null;
  isLoading: boolean;
};

export default function AiInterpretationDialog({ isOpen, setIsOpen, interpretationResult, isLoading }: AiInterpretationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            AI Error Interpretation
          </DialogTitle>
          <DialogDescription>
            An AI-powered analysis of the error and potential solutions.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ) : interpretationResult ? (
            <>
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Lightbulb className="text-primary"/> Interpretation</h3>
                <p className="text-muted-foreground prose prose-sm max-w-none">{interpretationResult.interpretation}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Lightbulb className="text-primary"/> Possible Solutions</h3>
                <p className="text-muted-foreground prose prose-sm max-w-none whitespace-pre-line">{interpretationResult.possibleSolutions}</p>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
