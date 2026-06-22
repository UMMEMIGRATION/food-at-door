import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foodatdoor.customer',
  appName: 'FoodAtDoor',
  webDir: 'out',
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "1000832072653-kpdnnh3kaiqkfeimudsvn84u7f0fo47v.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
