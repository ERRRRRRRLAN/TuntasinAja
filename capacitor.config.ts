import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuntasinaja.app',
  appName: 'TuntasinAja',
  webDir: 'out',
  server: {
    url: 'https://tuntasinaja-livid.vercel.app',
    cleartext: false
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  }
};

export default config;
