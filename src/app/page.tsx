import LogManager from '@/components/log-manager';
import { RailwayIcon } from '@/components/ui/icons';

export default function Home() {
  return (
    <div className="relative min-h-screen">
       <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, hsl(var(--accent)) 0%, transparent 30%), radial-gradient(circle at 75% 75%, hsl(var(--primary)) 0%, transparent 30%)',
        }}
      />
      <main className="container relative z-10 mx-auto p-4 py-8 md:p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mb-4">
             <RailwayIcon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl font-headline">
            Railway Logger
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            View your Railway deployment and app logs directly from here. Enter your credentials and service ID to get started.
          </p>
        </div>
        <LogManager />
      </main>
    </div>
  );
}
