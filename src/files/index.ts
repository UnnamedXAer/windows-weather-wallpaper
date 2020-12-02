import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import findNextFileName from 'find-next-file-name';
import consoleLog from '../utils/consoleLogger';
import { getEnvPrefix } from '../utils/envPrefix';
import { formatDate } from '../utils/formatDate';
import wallpaper from 'wallpaper';
import emitter from '../events/emitter';
import { IMPORTANT_ERROR } from '../events/eventsTypes';
import { Settings } from '../types/types';

export async function readImage(imgName: string) {
	if (imgName === '') {
		throw new Error('Empty image name supplied.');
	}
	const ext = path.extname(imgName);
	if (['.png', '.jpg', '.bmp', '.jiff'].includes(ext) === false) {
		throw new Error(`The "${ext}" is not an image file.`);
	}
	const imgPath = path.join(getAssetsPath('images'), imgName);

	try {
		const file = await fs.readFile(imgPath);
		return file;
	} catch (err) {
		throw err;
	}
}

export async function ensurePathExists(dir: string) {
	try {
		await fs.access(dir);
	} catch (err) {
		await fs.mkdir(dir, { recursive: true });
	}

	return dir;
}

export function getAssetsPath(
	resourceName: 'images' | 'images-output' | 'fonts' | 'data',
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
		settingsPath: path.join(__dirname, '..', 'pc-settings', getEnvPrefix()),
		settingsFileName: 'pc.settings.json'
	};
}

export async function copyFile(sourcePath: string, destinationPath: string) {
	consoleLog('Copying files from:', sourcePath, 'to:', destinationPath);
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
	}
	try {
		const logPath = await saveLog(text, err ? 'error' : 'default');
		await openInDefaultApp(logPath);
	} catch (err) {
		consoleLog('Unable to create or open log.');
	}
}

export async function saveDefaultWallpaper(settings: Settings) {
	if (!settings.defaultWallpaperPath) {
		const defaultWallpaperPath = await wallpaper.get();
		settings.defaultWallpaperPath = defaultWallpaperPath;

		const wallpaperCopyPath = await makeDefaultWallpaperCopy(defaultWallpaperPath);
		settings.wallpaperCopyPath = wallpaperCopyPath;
	}

	return settings;
}

export async function makeDefaultWallpaperCopy(defaultWallpaperPath: string) {
	const ext = path.extname(defaultWallpaperPath);
	try {
		const wallpaperCopyPath = getAssetsPath('images', 'default-wallpaper' + ext);
		await copyFile(defaultWallpaperPath, wallpaperCopyPath);
		return wallpaperCopyPath;
	} catch (err) {
		consoleLog('Unable to create copy of default wallpaper.');
		emitter.emit(IMPORTANT_ERROR);
		return;
	}
}

export async function getSettings() {
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