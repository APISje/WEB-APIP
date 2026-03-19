import { Link } from "wouter";
import { motion } from "framer-motion";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center relative z-10"
      >
        <div className="w-20 h-20 mx-auto bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-8 shadow-sm shadow-destructive/5">
          <AlertCircle className="w-10 h-10" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-6xl font-display font-bold text-foreground mb-4 tracking-tight">404</h1>
        <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Page not found</h2>
        
        <p className="text-muted-foreground mb-10 leading-relaxed text-lg">
          The page you are looking for doesn't exist or has been moved to another location within the workspace.
        </p>

        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          <Home className="w-5 h-5" />
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
