import { Link } from "wouter";
import { Terminal, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-destructive/10 rounded-full blur-[100px]" />
      </div>

      <div className="glass-panel p-10 rounded-2xl flex flex-col items-center text-center max-w-md relative z-10">
        <Terminal className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-6xl font-black font-mono tracking-tighter text-foreground mb-2">404</h1>
        <p className="text-xl font-bold uppercase tracking-widest text-muted-foreground mb-6">Sector Not Found</p>
        
        <p className="text-sm text-muted-foreground mb-8">
          The requested data node does not exist in the current terminal session. The asset or route may have been delisted.
        </p>
        
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 hover:-translate-y-0.5"
        >
          <Home className="w-4 h-4" />
          RETURN TO TERMINAL
        </Link>
      </div>
    </div>
  );
}
