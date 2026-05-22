import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { storage } from './storage';

const API_KEYS = {
  ios: 'appl_REPLACE_ME',
  android: 'goog_REPLACE_ME',
};

export const FINDOM_PRODUCT_ID = 'gg_findom_weekly';

export const revenueCat = {
  async init(): Promise<void> {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    const key = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
    await Purchases.configure({ apiKey: key });
  },

  async getOfferings() {
    try {
      return await Purchases.getOfferings();
    } catch {
      return null;
    }
  },

  async purchaseFindom(): Promise<boolean> {
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === FINDOM_PRODUCT_ID
      );
      if (!pkg) return false;

      await Purchases.purchasePackage(pkg);
      await storage.saveSubscription({ isFindom: true, expiresAt: null });
      return true;
    } catch {
      return false;
    }
  },

  async restorePurchases(): Promise<boolean> {
    try {
      const info = await Purchases.restorePurchases();
      const active = info.activeSubscriptions.includes(FINDOM_PRODUCT_ID);
      await storage.saveSubscription({ isFindom: active, expiresAt: null });
      return active;
    } catch {
      return false;
    }
  },

  async syncSubscriptionState(): Promise<void> {
    try {
      const info = await Purchases.getCustomerInfo();
      const active = info.activeSubscriptions.includes(FINDOM_PRODUCT_ID);
      await storage.saveSubscription({ isFindom: active, expiresAt: null });
    } catch {
      // fail silently, use cached state
    }
  },
};
