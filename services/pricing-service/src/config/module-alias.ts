import moduleAlias from 'module-alias';
import path from 'path';

// Register path aliases based on whether we're in development or production
const baseDir = path.resolve(__dirname, '../');

// For development with ts-node (source files)
if (process.env.NODE_ENV === 'development') {
  moduleAlias.addAliases({
    '@config': path.join(baseDir, 'config'),
    '@controllers': path.join(baseDir, 'controllers'),
    '@middlewares': path.join(baseDir, 'middlewares'),
    '@routes': path.join(baseDir, 'routes'),
    '@services': path.join(baseDir, 'services'),
    '@utils': path.join(baseDir, 'utils'),
    '@entities': path.join(baseDir, 'entities'),
    '@types': path.join(baseDir, 'types')
  });
}
// Production uses the _moduleAliases in package.json (compiled files) 