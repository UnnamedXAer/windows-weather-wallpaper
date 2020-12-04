import { fetchMyGeolocation } from './api';
import { readSettings, saveDefaultWallpaperCopy, saveSettings, updateWallpaperSize } from './files';
import consoleLog from './utils/consoleLogger';
import { Settings } from './types/types';
import { config } from './config';

export async function setupSettings() {
	let savedSettings = await readSettings();
	let settings: Settings;
	if (savedSettings !== null) {
		settings = savedSettings;
		if (settings.defaultWallpaperPath !== config.defaultWallpaperPath) {
			settings.defaultWallpaperPath = config.defaultWallpaperPath;
			settings.wallpaperCopyPath = null;
			settings.wallpaperSize = null;
		}
	} else {
		settings = {
			dt: new Date().toISOString(),
			defaultWallpaperPath: config.defaultWallpaperPath,
			wallpaperCopyPath: null,
			wallpaperSize: null,
			location: null
		};
	}

	settings = await saveDefaultWallpaperCopy(settings);
	
	if (settings.wallpaperSize === null) {
		settings = await updateWallpaperSize(settings);
	}

	if (!settings.location || config.trackLocationChanges === true) {
		const loc = await fetchMyGeolocation();
		settings.location = loc;
	}

	const updatedSettings = await updateStoredSettings(settings);
	return updatedSettings !== null ? updatedSettings : settings;
}

export async function updateStoredSettings(settings: Partial<Settings>) {
	const currentSettings = await readSettings();
	let updatedSettings = {} as Settings;
	if (currentSettings !== null) {
		updatedSettings = currentSettings;
	}
	Object.assign(updatedSettings, settings);
	const savedSettings = await saveSettings(updatedSettings);
	consoleLog('Stored settings updated.', savedSettings);
	return savedSettings;
}
