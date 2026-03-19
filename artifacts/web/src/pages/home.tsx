import { motion } from "framer-motion";
import { 
  Terminal, 
  Database, 
  Globe, 
  Layers, 
  FileJson, 
  Cpu 
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { CardStack, StackCard } from "@/components/ui/card-stack";
import { StatusBanner } from "@/components/status-banner";

const ARCHITECTURE_DATA = [
  {
    title: "Web Frontend",
    description: "React 19 + Vite application powered by Tailwind CSS v4 and Framer Motion. Uses React Query for state management.",
    icon: Globe,
    path: "artifacts/web",
  },
  {
    title: "API Server",
    description: "Express 5 backend server handling business logic, database connections, and serving the /api/healthz endpoint.",
    icon: Terminal,
    path: "artifacts/api-server",
  },
  {
    title: "Database Layer",
    description: "PostgreSQL integration using Drizzle ORM. Provides type-safe database schemas and queries.",
    icon: Database,
    path: "lib/db",
  },
  {
    title: "OpenAPI Spec",
    description: "Single source of truth for API contracts. Used by Orval to generate React Query hooks and Zod schemas.",
    icon: FileJson,
    path: "lib/api-spec",
  },
  {
    title: "Generated Hooks",
    description: "Auto-generated React Query hooks and fetch client providing fully typed API requests for the frontend.",
    icon: Layers,
    path: "lib/api-client-react",
  },
  {
    title: "Generated Zod",
    description: "Auto-generated Zod schemas used by the API server to validate incoming requests and outgoing responses.",
    icon: Cpu,
    path: "lib/api-zod",
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-[100px] z-10" />
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-abstract.png`}
          alt="Abstract background"
          className="w-full h-full object-cover opacity-50 dark:opacity-30 mix-blend-overlay"
        />
        {/* Subtle radial gradients for depth */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px] z-10" />
      </div>

      <Header />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-7xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Monorepo Architecture
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground mb-6 leading-tight">
              Full-Stack System <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Overview
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Explore the structural components of this monorepo. The application is built with a contract-first approach using OpenAPI, React 19, and Express.
            </p>
          </motion.div>

          <StatusBanner />

          <div className="mt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-semibold text-foreground flex items-center gap-3">
                <Layers className="w-6 h-6 text-primary" />
                Workspace Packages
              </h2>
            </div>
            
            <CardStack>
              {ARCHITECTURE_DATA.map((item, index) => (
                <StackCard
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  path={item.path}
                  delay={index * 0.1}
                />
              ))}
            </CardStack>
          </div>
          
        </div>
      </main>
    </div>
  );
}
