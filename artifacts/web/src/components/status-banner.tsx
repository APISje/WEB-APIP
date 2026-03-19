import { useHealthCheck } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Activity, Server, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBanner() {
  const { data, isLoading, isError, refetch, isFetching } = useHealthCheck({
    query: {
      refetchInterval: 30000, // Refetch every 30s
    }
  });

  const isHealthy = data?.status === 'ok';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="max-w-2xl mx-auto w-full mb-16"
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-1 shadow-sm transition-all duration-500",
        isLoading ? "bg-muted/30 border-border/50" : 
        isError ? "bg-destructive/5 border-destructive/20 shadow-destructive/5" : 
        "bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5 dark:bg-emerald-500/10"
      )}>
        <div className="bg-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              isLoading ? "bg-muted text-muted-foreground" : 
              isError ? "bg-destructive/10 text-destructive" : 
              "bg-emerald-500/10 text-emerald-500"
            )}>
              {isLoading ? <Activity className="w-6 h-6 animate-pulse" /> :
               isError ? <AlertCircle className="w-6 h-6" /> :
               <Server className="w-6 h-6" />}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">API Server Status</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-medium uppercase tracking-wider">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isLoading ? "bg-yellow-500 animate-pulse" : 
                    isError ? "bg-destructive" : 
                    "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  )} />
                  {isLoading ? 'Checking' : isError ? 'Offline' : 'Online'}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Connecting to backend services...' : 
                 isError ? 'Unable to reach the API server.' : 
                 `Response received: ${JSON.stringify(data)}`}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm border border-border/50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            Check Again
          </button>
        </div>
      </div>
    </motion.div>
  );
}
