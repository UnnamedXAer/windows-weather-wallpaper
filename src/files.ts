import fs from 'fs/promises';
import path from 'path';
import wallpaper from 'wallpaper';
import Jimp from 'jimp';
import findNextFileName from 'find-next-file-name';
import consoleLog from './utils/consoleLogger';
import { formatDate } from './utils/formatDate';
import { Settings, StorageDirectories } from './types/types';
import { config } from './config';
import { PathLike, Stats } from 'fs';
import { openInDefaultApp } from './processes';
import { DAY_IN_MS, DEFAULT_WALLPAPER_NAME_PREFIX, MINUTE_IN_MS } from './constants';

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
	resourceName: StorageDirectories,
	fileName?: string
) {
	let resourcePath = path.join(
		config.appTemporaryDataFolder,
		'storage',
		config.envPrefix,
		resourceName
	);
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
		await openLog(logPath);
	} catch (err) {
		return consoleLog('Unable to create log.');
	}
}

export async function openLog(logPath: PathLike) {
	try {
		return await openInDefaultApp(logPath);
	} catch (err) {
		consoleLog(`Unable to open the log file. "${logPath}"`);
	}
}

export async function saveDefaultWallpaperCopy(settings: Settings) {
	if (!settings.defaultWallpaperPath) {
		try {
			const defaultWallpaperPath = await wallpaper.get();
			settings.defaultWallpaperPath = defaultWallpaperPath;
		} catch (err) {
			consoleLog('Fail to save a copy of your wallpaper.');
			throw err;
		}
	}

	if (settings.defaultWallpaperPath) {
		const wallpaperCopyPath = await makeDefaultWallpaperCopy(
			settings.defaultWallpaperPath
		);
		settings.wallpaperCopyPath = wallpaperCopyPath;
	}

	return settings;
}

export async function makeDefaultWallpaperCopy(defaultWallpaperPath: string) {
	const defaultWallpaperName = path.basename(defaultWallpaperPath);
	const wallpaperCopyName = DEFAULT_WALLPAPER_NAME_PREFIX + defaultWallpaperName;
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
		// @refactor
		// @though: it's not the most optimal way removing old files.
		await fs.rm(wallpaperCopyPath, { recursive: true, force: true });
		await ensurePathExists(wallpaperCopyPath);
		await copyFile(defaultWallpaperPath, wallpaperCopyPathName);
		consoleLog('Copy of the wallpaper created.');
		return wallpaperCopyPathName;
	} catch (err) {
		consoleLog('Unable to create copy of the default wallpaper.', err);
		throw err;
	}
}

export async function updateWallpaperSize(settings: Settings) {
	const wallpaperSize = { width: 1300, height: 900 };
	try {
		if (settings.wallpaperCopyPath === null) {
			throw new Error(
				'Unable to update the wallpaper size - missing wallpaper copy path.'
			);
		}
		const wallpaperImg = await Jimp.read(settings.wallpaperCopyPath);
		wallpaperSize.width = wallpaperImg.getWidth();
		wallpaperSize.height = wallpaperImg.getHeight();
	} catch (err) {
		consoleLog('Unable to update the wallpaper size.');
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
		consoleLog('Unable to get the settings.', err);
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
		consoleLog('Unable to set the settings.', err);
		return null;
	}
}

export async function freeStorageSpace() {
	const olderThenTime: number =
		Date.now() - (config.isDev ? MINUTE_IN_MS * 20 : DAY_IN_MS * 2);
	let logTxt = '';
	let logErrorText = '';
	let currentLogTxt: string;
	let currentLogErrorText: string;
	consoleLog(
		'Will remove files created before: ',
		new Date(olderThenTime).toLocaleString('en-US')
	);

	const promises = ([
		'images/wallpaper',
		'images/weather',
		'logs'
	] as Array<StorageDirectories>).map(async (storageDirName) => {
		[currentLogTxt, currentLogErrorText] = await removeOldDirsInStorageSubdirectory(
			storageDirName,
			olderThenTime
		);
		logTxt += currentLogTxt;
		logErrorText += currentLogErrorText;
	});

	await Promise.all(promises);

	if (logErrorText !== '') {
		try {
			await saveAndOpenLog(
				'\n' + logErrorText,
				new Error('Fail to remove some of the directories.')
			);
		} catch (err) {
			//
		}
	}

	if (logTxt !== '') {
		try {
			await saveLog(
				'\nFreeing storage space summary\nThe following files have been deleted:' +
					logTxt
			);
		} catch (err) {
			//
		}
	}
}

export async function removeOldDirsInStorageSubdirectory(
	dirName: StorageDirectories,
	time: number
): Promise<[string, string]> {
	let logTxt = '';
	let logErrorText = '';
	const storageDirPath = await getStoragePath(dirName);
	try {
		const dirs = await fs.readdir(storageDirPath);
		for (let len = dirs.length, i = 0; i < len; i++) {
			const [success, removed, dirPath] = await removeOldDir(
				dirs[i],
				storageDirPath,
				time
			);
			if (!success) {
				logErrorText += '\n' + dirPath;
				continue;
			}
			if (removed) {
				logTxt += '\n' + dirPath;
				continue;
			}
		}
	} catch (err) {
		logErrorText += `\nDir: ${dirName} Error:\n${err.message}`;
	}
	return [logTxt, logErrorText];
}

export async function removeOldDir(
	dirName: string,
	sourceDir: string,
	olderThen: number
): Promise<[boolean, boolean, string]> {
	const dirPath = path.join(sourceDir, dirName);
	let dirType: string;
	try {
		const [shouldRemove, dirStat] = await checkIfDirShouldBeRemoved(
			dirPath,
			olderThen
		);
		if (shouldRemove === false) {
			return [true, false, dirPath];
		}

		dirType = getDirType(dirStat);

		if (dirType === '*other type') {
			throw new Error(
				`Deletion skipped, the directory is neither a file nor a folder. (${dirPath})`
			);
		}
		consoleLog(`About to delete ${dirType}: "${dirPath}"`);
		await fs.rm(dirPath, { recursive: true });
		consoleLog(`The "${dirName}" ${dirType} removed.`);
		return [true, true, dirPath];
	} catch (err) {
		consoleLog(`Fail to remove directory: "${dirPath}`, err);
		return [false, false, dirPath];
	}
}

export async function checkIfDirShouldBeRemoved(
	dirPath: string,
	oldestCreateTime: number
): Promise<[boolean, Stats]> {
	const dirStat = await fs.stat(dirPath);
	if (dirStat.ctimeMs < oldestCreateTime) {
		return [true, dirStat];
	}
	return [false, dirStat];
}

export function getDirType(dirStat: Stats) {
	if (dirStat.isDirectory()) {
		return 'folder';
	}
	if (dirStat.isFile()) {
		return 'file';
	}
	return '*other type';
}
