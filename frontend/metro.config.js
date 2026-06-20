const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-is': path.resolve(__dirname, 'node_modules/react-is'),
};

config.resolver.sourceExts = [
  ...(config.resolver.sourceExts || []),
  'cjs',
];

module.exports = config;
