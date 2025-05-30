import moduleAlias from 'module-alias';
import path from 'path';

// Register module aliases for development and production
const srcPath = path.resolve(__dirname, '..');

moduleAlias.addAliases({
  '@': srcPath,
  '@config': path.join(srcPath, 'config'),
  '@controllers': path.join(srcPath, 'controllers'),
  '@entities': path.join(srcPath, 'entities'),
  '@middlewares': path.join(srcPath, 'middlewares'),
  '@routes': path.join(srcPath, 'routes'),
  '@services': path.join(srcPath, 'services'),
  '@utils': path.join(srcPath, 'utils')
}); 