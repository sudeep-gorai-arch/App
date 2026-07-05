import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Network from "expo-network";

const KEYS = {
  notificationsEnabled: "flexiwalls.preferences.notificationsEnabled",
  wifiOnlyDownloads: "flexiwalls.preferences.wifiOnlyDownloads",
};

export const preferencesService = {
  async getNotificationsEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.notificationsEnabled);

    return value === "true";
  },

  async setNotificationsEnabled(enabled: boolean): Promise<{
    enabled: boolean;
    granted: boolean;
  }> {
    if (!enabled) {
      await AsyncStorage.setItem(KEYS.notificationsEnabled, "false");

      return {
        enabled: false,
        granted: false,
      };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const currentPermission = await Notifications.getPermissionsAsync();

    let granted = currentPermission.granted;

    if (!granted) {
      const requestedPermission =
        await Notifications.requestPermissionsAsync();

      granted = requestedPermission.granted;
    }

    await AsyncStorage.setItem(
      KEYS.notificationsEnabled,
      granted ? "true" : "false",
    );

    return {
      enabled: granted,
      granted,
    };
  },

  async getWifiOnlyDownloads(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.wifiOnlyDownloads);

    if (value === null) {
      return true;
    }

    return value === "true";
  },

  async setWifiOnlyDownloads(enabled: boolean): Promise<boolean> {
    await AsyncStorage.setItem(
      KEYS.wifiOnlyDownloads,
      enabled ? "true" : "false",
    );

    return enabled;
  },

  async canDownloadNow(): Promise<{
    allowed: boolean;
    reason: string;
  }> {
    const wifiOnlyDownloads = await this.getWifiOnlyDownloads();

    if (!wifiOnlyDownloads) {
      return {
        allowed: true,
        reason: "",
      };
    }

    const networkState = await Network.getNetworkStateAsync();

    const isWifi = networkState.type === Network.NetworkStateType.WIFI;

    if (isWifi) {
      return {
        allowed: true,
        reason: "",
      };
    }

    return {
      allowed: false,
      reason:
        "Wi-Fi only downloads are enabled. Please connect to Wi-Fi or turn this setting off from Settings.",
    };
  },
};