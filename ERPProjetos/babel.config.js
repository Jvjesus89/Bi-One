module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin para React Native Reanimated
      'react-native-reanimated/plugin',
    ],
  };
}; 