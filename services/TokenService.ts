import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

let token: string | null = null;

const TOKEN_KEY = "token";
const isWeb = Platform.OS === "web";

export async function setToken(newToken: string | null) {
  token = newToken;

  try {
    if (token) {
      if (isWeb) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } else {
      if (isWeb) {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    }
  } catch (error) {
    console.error("Storage error:", error);
    throw error;
  }
}

export async function getToken() {
  if (token !== null) {
    return token;
  }

  try {
    if (isWeb) {
      token = await AsyncStorage.getItem(TOKEN_KEY);
    } else {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
}

export async function clearToken() {
  token = null;

  try {
    if (isWeb) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error clearing token:", error);
    throw error;
  }
}
