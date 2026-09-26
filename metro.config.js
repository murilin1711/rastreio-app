// Sentry (D-058): mesma configuração do Expo, com os identificadores que ligam o erro ao código-fonte.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = (() => {
  const config = getSentryExpoConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: [...resolver.assetExts.filter((ext) => ext !== 'svg'), 'lottie'],
    sourceExts: [...resolver.sourceExts, 'svg'],
    unstable_enablePackageExports: false,
  };

  return config;
})();
