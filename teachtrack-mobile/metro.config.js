const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// Enable importing .svg as React components using react-native-svg-transformer
// Requires: npm i -D react-native-svg-transformer
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
