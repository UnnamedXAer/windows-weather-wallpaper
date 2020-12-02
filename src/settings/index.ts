import { fetchMyGeolocation } from '../api/api';
import { getSettings, saveDefaultWallpaper, saveSettings } from '../files';
import consoleLog from '../utils/consoleLogger';
import { Settings } from '../types/types';

export async function setupSettings() {
	let savedSettings = await getSettings();
	let settings =
		savedSettings !== null
			? savedSettings
			: ({
					dt: new Date().toISOString()
			  } as Settings);

	settings = await saveDefaultWallpaper(settings);
	if (!settings.location) {
		const loc = await fetchMyGeolocation();
		settings.location = loc;
	}

	const updatedSettings = await updateStoredSettings(settings);
	return updatedSettings !== null ? updatedSettings : settings;
}

export async function updateStoredSettings(settings: Partial<Settings>) {
	const currentSettings = await getSettings();
	let updatedSettings = {} as Settings;
	if (currentSettings !== null) {
		updatedSettings = currentSettings;
	}
	Object.assign(updatedSettings, settings);
	const savedSettings = await saveSettings(updatedSettings);
	consoleLog('Stored settings updated.', savedSettings);
	return savedSettings;
}
