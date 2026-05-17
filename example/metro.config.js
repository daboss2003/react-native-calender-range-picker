const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [libraryRoot];
config.resolver.unstable_enableSymlinks = true;

config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];

config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_target, name) => path.join(projectRoot, 'node_modules', name),
  }
);

module.exports = config;
