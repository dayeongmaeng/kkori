const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const reversedIosClientId = iosClientId
  ? iosClientId.split('.').reverse().join('.')
  : undefined;

/** @param {{ config: import('@expo/config').ExpoConfig }} ctx */
module.exports = ({ config }) => {
  if (!reversedIosClientId) return config;

  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        CFBundleURLTypes: [
          ...(config.ios?.infoPlist?.CFBundleURLTypes ?? []),
          { CFBundleURLSchemes: [reversedIosClientId] },
        ],
      },
    },
  };
};
