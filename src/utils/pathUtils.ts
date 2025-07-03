import { join } from 'path';

const rootDir = process.cwd();

export const getSrcDirname = () => {
  return join(rootDir, 'src');
};

export const getEnvironmentPath = (): string => {
  const nodeEnv = process.env['NODE_ENV']?.toLowerCase();
  const envMap: Record<string, string> = {
    production: '.env.production',
    development: '.env.development',
    test: '.env.test',
  };

  return envMap[nodeEnv || ''] || '.env';
};
