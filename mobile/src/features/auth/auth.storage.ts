import * as SecureStore from "expo-secure-store";

const KEY = "FIELDPIN_ACCESS_TOKEN";

export async function setAccessToken(token: string) {
  await SecureStore.setItemAsync(KEY, token);
}

export async function getAccessToken() {
  return await SecureStore.getItemAsync(KEY);
}

export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(KEY);
}