interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  database: DatabaseConfig;
  jwtSecret: string;
  corsOrigins: string[];
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

function parseDbUrl(url: string): DatabaseConfig {
  const dbUrl = new URL(url);
  return {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port, 10) || 5432,
    username: dbUrl.username,
    password: dbUrl.password,
    name: dbUrl.pathname.slice(1) // Remove leading '/'
  };
}

export const config: Config = {
  nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  port: parseInt(process.env.PORT || '3006', 10),
  database: parseDbUrl(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/orders'),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3006').split(','),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
}; 