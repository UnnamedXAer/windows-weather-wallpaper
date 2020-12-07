import fs from 'fs/promises';
import path from 'path';
import wallpaper from 'wallpaper';
import Jimp from 'jimp';
import findNextFileName from 'find-next-file-name';
import consoleLog from './utils/consoleLogger';
import { formatDate } from './utils/formatDate';
import { Settings } from './types/types';
import { config } from './config';
import { PathLike } from 'fs';
import { openInDefaultApp } from './processes';

export async function ensurePathExists(dir: PathLike) {
	try {
		await fs.access(dir);
	} catch (err) {
		consoleLog('About to create dir:', dir);
		await fs.mkdir(dir, { recursive: true });
	}

	return dir;
}

export async function getStoragePath(
	resourceName:
		| 'logs'
		| 'test-data'
		| 'images/weather'
		| 'images/default-wallpaper'
		| 'images/wallpaper'
		| 'settings',
	fileName?: string
) {
	let resourcePath = path.join(__dirname, 'storage', config.envPrefix, resourceName);
	if (resourceName === 'test-data') {
		resourcePath = path.join(__dirname, 'storage', resourceName);
	}

	await ensurePathExists(resourcePath);
	if (fileName) {
		resourcePath = path.join(resourcePath, fileName);
	}

	return resourcePath;
}

export async function getSettingsPath() {
	return {
		settingsPath: await getStoragePath('settings'),
		settingsFileName: `pc.${
			config.envPrefix === 'prod' ? '' : config.envPrefix + '-'
		}settings.json`
	};
}

export async function copyFile(sourcePath: string, destinationPath: string) {
	consoleLog('About to copy file from:', sourcePath, 'to:', destinationPath);
	try {
		return await fs.copyFile(sourcePath, destinationPath);
	} catch (err) {
		throw err;
	}
}

export async function saveLog(text: string, type?: 'error' | 'default') {
	try {
		const storagePath = await getStoragePath('logs');
		let logFileName = `log${type === 'error' ? '-error' : ''}-${formatDate(
			new Date()
		)}.log`;
		logFileName = findNextFileName(storagePath, logFileName);
		const logPath = path.join(storagePath, logFileName);
		await fs.writeFile(logPath, text);
		return logPath;
	} catch (err) {
		consoleLog('Unable to save log.', err);
		throw err;
	}
}

export async function saveAndOpenLog(description: string, err?: Error) {
	let text = new Date().toISOString();
	text += '\n\n' + description;
	if (err) {
		text += '\n\nError';
		text += '\n > name: ' + err.name;
		text += '\n > message: ' + err.message;
		text += '\n > stack: ' + err.stack;
		text += '\n\n Error object:\n' + require('util').inspect(err);
	}
	try {
		const logPath = await saveLog(text, err ? 'error' : 'default');
		await openInDefaultApp(logPath);
	} catch (err) {
		consoleLog('Unable to create or open log.');
	}
}

export async function saveDefaultWallpaperCopy(settings: Settings) {
	if (!settings.defaultWallpaperPath) {
		const defaultWallpaperPath = await wallpaper.get();
		settings.defaultWallpaperPath = defaultWallpaperPath;
	}

	const wallpaperCopyPath = await makeDefaultWallpaperCopy(
		settings.defaultWallpaperPath
	);
	settings.wallpaperCopyPath = wallpaperCopyPath;

	return settings;
}

export async function makeDefaultWallpaperCopy(defaultWallpaperPath: string) {
	const defaultWallpaperName = path.basename(defaultWallpaperPath);
	const wallpaperCopyName = 'def-wallpaper-' + defaultWallpaperName;
	const wallpaperCopyPath = await getStoragePath('images/default-wallpaper');
	const wallpaperCopyPathName = path.join(wallpaperCopyPath, wallpaperCopyName);
	try {
		await fs.access(wallpaperCopyPathName);
		consoleLog('The wallpaper copy already exists.');
		return wallpaperCopyPathName;
	} catch (err) {
		/* do nothing */
	}
	try {
		await ensurePathExists(wallpaperCopyPath);
		await copyFile(defaultWallpaperPath, wallpaperCopyPathName);
		consoleLog('Copy of the wallpaper created.');
		return wallpaperCopyPathName;
	} catch (err) {
		consoleLog('Unable to create copy of default wallpaper.', err);
		throw err;
	}
}

export async function updateWallpaperSize(settings: Settings) {
	const wallpaperSize = { width: 1300, height: 900 };
	try {
		if (settings.wallpaperCopyPath === null) {
			throw new Error(
				'Unable to update wallpaper size - missing wallpaper copy path.'
			);
		}
		const wallpaperImg = await Jimp.read(settings.wallpaperCopyPath);
		wallpaperSize.width = wallpaperImg.getWidth();
		wallpaperSize.height = wallpaperImg.getHeight();
	} catch (err) {
		consoleLog('Unable to update wallpaper size.');
	}
	settings.wallpaperSize = wallpaperSize;
	return settings;
}

export async function readSettings() {
	const { settingsPath, settingsFileName } = await getSettingsPath();
	const filePath = path.join(settingsPath, settingsFileName);
	try {
		const fileContent = await fs.readFile(filePath);
		const settings = JSON.parse(fileContent.toString()) as Settings;

		return settings;
	} catch (err) {
		consoleLog('Unable to get settings.', err);
		return null;
	}
}

export async function saveSettings(settings: Settings) {
	const { settingsPath, settingsFileName } = await getSettingsPath();
	await ensurePathExists(settingsPath);
	const updatedSettings = { ...settings, dt: new Date().toISOString() } as Settings;
	const fileContent = JSON.stringify(updatedSettings, null, 4);
	const filePath = path.join(settingsPath, settingsFileName);
	try {
		await fs.writeFile(filePath, fileContent);
		return updatedSettings;
	} catch (err) {
		consoleLog('Unable to set settings.', err);
		return null;
	}
}
