import { Bot } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center text-center">
       <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, hsl(var(--accent)) 0%, transparent-30%), radial-gradient(circle at 75% 75%, hsl(var(--primary)) 0%, transparent 30%)',
        }}
      />
      <main className="container relative z-10 mx-auto p-4 py-8 md:p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
             <Bot className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl font-headline">
            Railway Logger Bot
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            El bot se está ejecutando. Revisa tu terminal para ver los logs del bot.
          </p>
           <p className="mt-2 text-sm text-muted-foreground/80">
            Puedes interactuar con el bot en tu servidor de Discord.
          </p>
        </div>
      </main>
    </div>
  );
}
