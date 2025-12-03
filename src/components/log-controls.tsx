'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchLogsAction } from '@/app/actions';
import type { LogEntry } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Server, Terminal, KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';

const FormSchema = z.object({
  railwayApiKey: z.string().min(1, 'Railway API Token is required.'),
  serviceId: z.string().min(1, 'Service ID is required.'),
  password: z.string().min(1, 'Password is required.'),
});

type FormValues = z.infer<typeof FormSchema>;

type LogControlsProps = {
  setLogs: Dispatch<SetStateAction<LogEntry[]>>;
  setLogTitle: Dispatch<SetStateAction<string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
};

export default function LogControls({ setLogs, setLogTitle, setIsLoading, setError, isLoading }: LogControlsProps) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      railwayApiKey: '',
      serviceId: '',
      password: '',
    },
  });

  const handleFetchLogs = async (logType: 'deploy' | 'app') => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setLogTitle('');

    const values = form.getValues();
    const result = await fetchLogsAction(values, logType);

    if (result.error) {
      setError(result.error);
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      setLogs(result.logs);
      setLogTitle(result.title);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>Enter your Railway API token, service ID, and password to fetch logs.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="railwayApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Railway API Token</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="proj-..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service ID</FormLabel>
                    <FormControl>
                      <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="App password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button onClick={() => handleFetchLogs('deploy')} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Server />}
                Fetch Deployment Logs
              </Button>
              <Button onClick={() => handleFetchLogs('app')} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal />}
                Fetch Application Logs
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
