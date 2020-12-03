import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import Jimp from 'jimp';
import findNextFileName from 'find-next-file-name';
import consoleLog from '../utils/consoleLogger';
import { getEnvPrefix } from '../utils/envPrefix';
import { formatDate } from '../utils/formatDate';
import wallpaper from 'wallpaper';
import emitter from '../events/emitter';
import { IMPORTANT_ERROR } from '../events/eventsTypes';
import { Settings } from '../types/types';

export async function ensurePathExists(dir: string) {
	try {
		await fs.access(dir);
	} catch (err) {
		await fs.mkdir(dir, { recursive: true });
	}

	return dir;
}

export function getAssetsPath(
	resourceName: 'images' | 'images-output' | 'data',
	fileName?: string
) {
	if (!resourceName)
		throw new Error('Parameter "resourceName" is required and cannot be empty');
	if (fileName) {
		return path.join(
			__dirname,
			'..',
			'assets',
			getEnvPrefix(),
			resourceName,
			fileName
		);
	}
	return path.join(__dirname, '..', 'assets', getEnvPrefix(), resourceName);
}

export function getStoragePath(resourceName: 'logs', fileName?: string) {
	if (!resourceName)
		throw new Error('Parameter "resourceName" is required and cannot be empty');
	if (fileName) {
		return path.join(
			__dirname,
			'..',
			'storage',
			getEnvPrefix(),
			resourceName,
			fileName
		);
	}
	return path.join(__dirname, '..', 'storage', getEnvPrefix(), resourceName);
}

export function getSettingsPath() {
	return {
		settingsPath: path.join(__dirname, '..', '..', 'pc-settings', getEnvPrefix()),
		settingsFileName: 'pc.settings.json'
	};
}

export async function copyFile(sourcePath: string, destinationPath: string) {
	consoleLog('About to copy file from:', sourcePath, 'to:', destinationPath);
	try {
		await fs.copyFile(sourcePath, destinationPath);
	} catch (err) {
		throw err;
	}
}

export async function saveLog(text: string, type: 'error' | 'default') {
	try {
		const storagePath = getStoragePath('logs');
		await ensurePathExists(storagePath);
		let logFileName = `log${type === 'error' ? '-error' : ''}${formatDate(
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

export async function openInDefaultApp(filePath: string) {
	try {
		const subprocess = exec('start "" "' + filePath + '"');
		consoleLog('Spawned subprocess #', subprocess.pid, filePath);
		subprocess.on('close', (code, signal) => {
			consoleLog(
				'Subprocess #',
				subprocess.pid,
				'Closed with code:',
				code,
				' and signal: ',
				signal
			);
		});
	} catch (err) {
		consoleLog('Fail to open (in default app):', filePath);
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
	const wallpaperCopyPath = getAssetsPath('images');
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
		const wallpaperImg = Jimp.read(settings.wallpaperCopyPath);
		wallpaperSize.width = (await wallpaperImg).getWidth();
		wallpaperSize.height = (await wallpaperImg).getHeight();
	} catch (err) {
		consoleLog('Unable to update wallpaper size.');
	}
	settings.wallpaperSize = wallpaperSize;
	return settings;
}

export async function readSettings() {
	const { settingsPath, settingsFileName } = getSettingsPath();
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
	const { settingsPath, settingsFileName } = getSettingsPath();
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
