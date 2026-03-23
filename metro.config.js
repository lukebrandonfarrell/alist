const { getDefaultConfig } = require('expo/metro-config');
const { withReactNativeGrab } = require('react-native-grab/metro');

const config = getDefaultConfig(__dirname);
module.exports = withReactNativeGrab(config);
