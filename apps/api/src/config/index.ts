import { config as loadEnv } from 'dotenv';
loadEnv();

interface Config {
  env: string;
  port: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  corsOrigins: string[];
  aiProvider: string;
  aiModel: string;
  aiApiKey: string;
  isDev: boolean;
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  aiProvider: process.env.AI_PROVIDER || 'anthropic',
  aiModel: process.env.AI_MODEL || 'claude-sonnet-4-6',
  aiApiKey: process.env.AI_API_KEY || '',
  isDev: process.env.NODE_ENV !== 'production',
};

export default config;
