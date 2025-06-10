import { join } from 'path';

const rootDir = process.cwd();

export const getSrcDirname = () => {
  return join(rootDir, 'src');
};
