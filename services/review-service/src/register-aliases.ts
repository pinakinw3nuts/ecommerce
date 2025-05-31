import moduleAlias from 'module-alias';
import path from 'path';
import { addAliases } from 'module-alias';

// Register module aliases for runtime path resolution
const srcPath = path.resolve(__dirname);

addAliases({
  '@config': path.join(srcPath, 'config'),
  '@controllers': path.join(srcPath, 'controllers'),
  '@entities': path.join(srcPath, 'entities'),
  '@middleware': path.join(srcPath, 'middleware'),
  '@routes': path.join(srcPath, 'routes'),
  '@services': path.join(srcPath, 'services'),
  '@utils': path.join(srcPath, 'utils')
}); 