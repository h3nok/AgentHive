// Mock API for settings
import settingsMock from '../mocks/settings.json';

export async function fetchSettings() {
  await new Promise(res => setTimeout(res, 300));
  return settingsMock;
}

export async function updateSettings(payload: any) {
  return { ...settingsMock, ...payload };
} 