import fs from 'fs/promises';
import path from 'path';
import { mocked } from 'ts-jest/utils';
import wallpaper from 'wallpaper';
import Jimp from 'jimp';
import {
	checkIfDirShouldBeRemoved,
	copyFile,
	ensurePathExists,
	freeStorageSpace,
	getDirType,
	getSettingsPath,
	getStoragePath,
	makeDefaultWallpaperCopy,
	readSettings,
	removeOldDir,
	removeOldDirsInStorageSubdirectory,
	saveAndOpenLog,
	saveDefaultWallpaperCopy,
	saveLog,
	saveSettings,
	updateWallpaperSize
} from '../files';
import { openInDefaultApp } from '../processes';
import { NODE_ENV, Settings } from '../types/types';
import {
	DAY_IN_MS,
	DEFAULT_WALLPAPER_NAME_PREFIX,
	HOUR_IN_MS,
	MINUTE_IN_MS
} from '../constants';
import { formatDate } from '../utils/formatDate';
import { Stats, Dirent } from 'fs';
import { config } from '../config';

jest.mock('../processes');
jest.mock('wallpaper');
jest.mock('jimp');
jest.mock('fs/promises');

const mockedFs = mocked(fs, true);
const mockedWallpaper = mocked(wallpaper, true);
const mockedJimp = mocked(Jimp);

const DEFAULT_SETTINGS: Settings = {
	defaultWallpaperPath: null,
	dt: null,
	location: null,
	wallpaperCopyPath: null,
	wallpaperSize: null
};

const now = Date.now();
const exampleName = 'waterfall.png';
const examplePath = 'X://my-wallpapers';
const examplePathName = `${examplePath}/${exampleName}`;

// @thought: I think that if these mocked values were more thoughtful then the tests will not be so messy.
const fsReadDirMockReturnValue = Promise.resolve(
	new Array(3).fill('').map((_, idx) => `wallpaper-${formatDate()} (${idx}).jpg`)
) as Promise<any[]>;

const fsStatsMockReturnValue = Array(3)
	.fill(1)
	.map((_, idx) => {
		return Promise.resolve({
			atimeMs: now - MINUTE_IN_MS * idx,
			ctimeMs: now - MINUTE_IN_MS * idx,
			mtimeMs: now - 1000 * idx,
			isDirectory: () => idx / 2 === 0,
			isFile: () => idx / 2 !== 0
		} as Stats);
	})
	.concat(
		Promise.resolve({
			atimeMs: now - MINUTE_IN_MS * 100000,
			ctimeMs: now - MINUTE_IN_MS * 100000,
			mtimeMs: now - MINUTE_IN_MS * 100000,
			isDirectory: () => false,
			isFile: () => false
		} as Stats)
	);

const getSettingsPathPattern = (envFolder: string = 'test') =>
	new RegExp(
		`${config.appTemporaryDataFolder.replace(/[\\]/g, '\\\\')}\\\\storage\\\\${envFolder}\\\\settings`
	);

const storagePathPathPatternString = `${config.appTemporaryDataFolder.replace(/[\\]/g, '\\\\')}\\\\storage\\\\test`;

test('should create a directory if not exists and return the path', async () => {
	const existingPath = '../../src/__tests__';
	const notExistingPath = '../../src/__tests__/very-not-existing-path2';

	const returnPath = await ensurePathExists(existingPath);
	expect(returnPath).toMatch(existingPath);

	mockedFs.access.mockReturnValueOnce(Promise.reject('Dir does not exists.'));
	await ensurePathExists(notExistingPath);

	expect(fs.access).toHaveBeenCalledTimes(2);
	expect(fs.mkdir).toHaveBeenCalledTimes(1);
});

test('should return the path to the storage directory with the env prefix', async () => {
	expect(await getStoragePath('settings')).toMatch(getSettingsPathPattern());
	expect(await getStoragePath('images/default-wallpaper')).toMatch(
		new RegExp(storagePathPathPatternString + '\\\\images\\\\default-wallpaper$')
	);
	expect(await getStoragePath('images/wallpaper')).toMatch(
		new RegExp(storagePathPathPatternString + '\\\\images\\\\wallpaper$')
	);
	expect(await getStoragePath('images/weather')).toMatch(
		new RegExp(storagePathPathPatternString + '\\\\images\\\\weather$')
	);
	expect(await getStoragePath('test-data')).toMatch(/.\\src\\storage\\test-data$/);

	const storagePath = await getStoragePath(
		'test-data',
		`${DEFAULT_WALLPAPER_NAME_PREFIX}.jpg`
	);
	expect(storagePath).toMatch(
		new RegExp(
			`\\\\src\\\\storage\\\\test-data\\\\${DEFAULT_WALLPAPER_NAME_PREFIX}[.]jpg$`
		)
	);
});

test('should copy file', async () => {
	mockedFs.copyFile.mockResolvedValue(Promise.resolve());

	const res = await copyFile(
		await getStoragePath('test-data', '${DEFAULT_WALLPAPER_NAME_PREFIX}.jpg'),
		await getStoragePath('test-data', '${DEFAULT_WALLPAPER_NAME_PREFIX}-jest.jpg')
	);

	await copyFile(
		await getStoragePath('test-data', '${DEFAULT_WALLPAPER_NAME_PREFIX}.jpg'),
		await getStoragePath('test-data', '${DEFAULT_WALLPAPER_NAME_PREFIX}-jest2.jpg')
	);

	expect(res).toBeUndefined();
	expect(mockedFs.copyFile).toBeCalledTimes(2);
});

test('should return path and name of the settings file', async () => {
	const { settingsFileName, settingsPath } = await getSettingsPath();
	expect(settingsFileName).toMatch('pc.test-settings.json');
	expect(settingsPath).toMatch(getSettingsPathPattern());

	const prefix = config.envPrefix;
	config.envPrefix = 'prod';
	const settingsFileInfo = await getSettingsPath();
	expect(settingsFileInfo.settingsFileName).toBe('pc.settings.json');
	expect(settingsFileInfo.settingsPath).toMatch(getSettingsPathPattern('prod'));

	config.envPrefix = prefix;
});

test('should write text to log file and return path base on type parameter.', async () => {
	let logPath = await saveLog('My text', 'error');
	expect(logPath).toMatch(/\\logs\\log-error-[\d]{4}(-\d\d){2}[.]log$/);

	logPath = await saveLog('My text', 'default');
	expect(logPath).toMatch(/\\logs\\log-[\d]{4}(-\d\d){2}[.]log$/);

	logPath = await saveLog('My text');
	expect(logPath).toMatch(/\\logs\\log-[\d]{4}(-\d\d){2}[.]log$/);

	expect(mockedFs.writeFile).toBeCalledTimes(3);
});

test('should save copy the default wallpaper', async () => {
	let wallpaperCopyPath: string;

	mockedFs.copyFile.mockClear();
	mockedFs.access.mockClear();
	mockedFs.access
		.mockResolvedValueOnce()
		.mockRejectedValueOnce(new Error('Dir does not exists.'));

	wallpaperCopyPath = await makeDefaultWallpaperCopy(examplePathName);

	expect(wallpaperCopyPath).toMatch(
		new RegExp(`\\\\${DEFAULT_WALLPAPER_NAME_PREFIX}${exampleName}$`)
	);
	expect(mockedFs.access).toBeCalledTimes(3);
	expect(mockedFs.copyFile).toBeCalledTimes(1);

	mockedFs.copyFile.mockClear();
	mockedFs.access.mockClear();

	wallpaperCopyPath = await makeDefaultWallpaperCopy(examplePathName);

	expect(wallpaperCopyPath).toMatch(
		new RegExp(`\\\\${DEFAULT_WALLPAPER_NAME_PREFIX}${exampleName}$`)
	);
	expect(mockedFs.access).toBeCalledTimes(2);
	expect(mockedFs.copyFile).toBeCalledTimes(0);
});

test('should ', async () => {
	mockedWallpaper.get.mockResolvedValue(examplePathName);

	let settings = await saveDefaultWallpaperCopy({
		...DEFAULT_SETTINGS
	});

	expect(settings.defaultWallpaperPath).toBe(examplePathName);
	expect(settings.wallpaperCopyPath).not.toBeNull;

	settings = await saveDefaultWallpaperCopy({ ...settings, wallpaperCopyPath: null });

	expect(settings.wallpaperCopyPath).not.toBeNull;

	settings = await saveDefaultWallpaperCopy(settings);

	expect(settings.wallpaperCopyPath).not.toBeNull;
});

test('should update the settings with the wallpaper size', async () => {
	// const examplePath = 'X://project-path-wallpapers/waterfall.png';

	mockedJimp.read.mockImplementation(
		async () =>
			({
				getWidth: () => 1920,
				getHeight: () => 1080
			} as Jimp)
	);

	let settings: Settings = { ...DEFAULT_SETTINGS };

	settings = await updateWallpaperSize(settings);
	expect(settings.wallpaperSize).toMatchObject({ width: 1300, height: 900 });
	settings = await updateWallpaperSize({
		...settings,
		wallpaperCopyPath: examplePathName
	});
	expect(settings.wallpaperSize).toMatchObject({ width: 1920, height: 1080 });
	expect(mockedJimp.read).toBeCalledTimes(1);
});

test('should read settings from file', async () => {
	mockedFs.readFile
		.mockRejectedValueOnce(new Error('Directory does not exist.'))
		.mockResolvedValueOnce(JSON.stringify(DEFAULT_SETTINGS));
	let settings = await readSettings();
	expect(settings).toBeNull();

	settings = await readSettings();
	expect(settings).toMatchObject(DEFAULT_SETTINGS);

	expect(mockedFs.readFile).toBeCalledTimes(2);
});

test('should save the settings object to the file', async () => {
	mockedFs.writeFile
		.mockRejectedValueOnce(new Error('Directory does not exist.'))
		.mockResolvedValueOnce();
	let settings = await saveSettings({ ...DEFAULT_SETTINGS });
	expect(settings).toBeNull();
	settings = await saveSettings({ ...DEFAULT_SETTINGS });
	expect(settings).toMatchObject<Settings>({
		...DEFAULT_SETTINGS,
		dt: expect.any(String)
	});

	expect(mockedFs.writeFile).toBeCalledTimes(2);
});

test('should write text to log file and open it.', async () => {
	await saveAndOpenLog('My text for error log.', new Error('My test error'));
	await saveAndOpenLog('My text for normal log.');
	expect(mockedFs.writeFile).toBeCalledTimes(2);
	expect(openInDefaultApp).toBeCalledTimes(2);
});

test('should remove old files from storage folder', async () => {
	mockedFs.readdir.mockReset();
	mockedFs.readdir.mockResolvedValue([] as Dirent[]);

	await freeStorageSpace();
	expect(mockedFs.writeFile).toBeCalledTimes(0);

	mockedFs.readdir.mockReset();
	mockedFs.readdir.mockReturnValue(fsReadDirMockReturnValue);

	mockedFs.stat.mockReset();
	fsStatsMockReturnValue.map((returnValue) => {
		return mockedFs.stat.mockReturnValueOnce(returnValue);
	});

	expect(await freeStorageSpace()).toBeUndefined();

	expect(mockedFs.readdir).toBeCalledTimes(3);

	mockedFs.readdir.mockRejectedValueOnce(new Error('Mock reject error.'));
	expect(await freeStorageSpace()).toBeUndefined();
	expect(mockedFs.writeFile).toBeCalled();

	mockedFs.stat.mockResolvedValueOnce({
		atimeMs: 100000,
		ctimeMs: 100000,
		mtimeMs: 100000,
		isDirectory: () => true && true,
		isFile: () => false
	} as Stats);
	mockedFs.writeFile.mockReset();
	config.isDev = false;
	await freeStorageSpace();
	expect(mockedFs.writeFile).toBeCalledTimes(2);
});

test('should return directory type', () => {
	expect(
		getDirType({
			isDirectory: () => true,
			isFile: () => false
		} as Stats)
	).toBe('folder');

	expect(
		getDirType({
			isDirectory: () => false,
			isFile: () => true
		} as Stats)
	).toBe('file');

	expect(
		getDirType({
			isDirectory: () => true,
			isFile: () => true
		} as Stats)
	).toBe('folder');

	expect(
		getDirType({
			isDirectory: () => false,
			isFile: () => false
		} as Stats)
	).toBe('*other type');
});

test('should check if the file is old enough to be deleted', async () => {
	mockedFs.stat.mockReset();

	fsStatsMockReturnValue.forEach((returnValue) =>
		mockedFs.stat.mockReturnValueOnce(returnValue)
	);
	let [shouldRemove, stats] = await checkIfDirShouldBeRemoved(
		examplePath,
		now - DAY_IN_MS
	);
	expect(shouldRemove).toBe(false);
	expect(stats).toMatchObject(fsStatsMockReturnValue[0]);

	[shouldRemove, stats] = await checkIfDirShouldBeRemoved(
		examplePath,
		now - HOUR_IN_MS
	);
	expect(shouldRemove).toBe(false);
	expect(stats).toMatchObject(fsStatsMockReturnValue[1]);

	[shouldRemove, stats] = await checkIfDirShouldBeRemoved(
		examplePath,
		now - MINUTE_IN_MS
	);
	expect(shouldRemove).toBe(true);
	expect(stats).toMatchObject(fsStatsMockReturnValue[2]);
});

test('should remove old directories from storage', async () => {
	mockedFs.stat.mockReset();
	fsStatsMockReturnValue.map((returnValue) => {
		return mockedFs.stat.mockReturnValueOnce(returnValue);
	});
	let oldestTime = (await fsStatsMockReturnValue[0]).ctimeMs + 1;
	let removeInfo = await removeOldDir(exampleName, examplePath, oldestTime);
	expect(removeInfo).toMatchObject([true, true, path.normalize(examplePathName)]);

	oldestTime = (await fsStatsMockReturnValue[1]).ctimeMs - 1;
	removeInfo = await removeOldDir(exampleName, examplePath, oldestTime);
	expect(removeInfo).toMatchObject([true, false, path.normalize(examplePathName)]);

	mockedFs.rm.mockRejectedValueOnce(new Error('No file error mock.'));
	oldestTime = (await fsStatsMockReturnValue[2]).ctimeMs - 1;
	removeInfo = await removeOldDir(exampleName, examplePath, oldestTime);
	expect(removeInfo).toMatchObject([true, false, path.normalize(examplePathName)]);

	mockedFs.rm.mockRejectedValueOnce(new Error('No file error mock.'));
	oldestTime = (await fsStatsMockReturnValue[3]).ctimeMs + 1;
	removeInfo = await removeOldDir(exampleName, examplePath, oldestTime);
	expect(removeInfo).toMatchObject([false, false, path.normalize(examplePathName)]);
});

test('should remove the old dirs in the given storage folder.', async () => {
	mockedFs.stat.mockReset();
	fsStatsMockReturnValue.map((returnValue) => {
		return mockedFs.stat.mockReturnValueOnce(returnValue);
	});
	mockedFs.readdir.mockReset();
	mockedFs.readdir.mockReturnValue(fsReadDirMockReturnValue);
	fsStatsMockReturnValue.forEach((returnValue) =>
		mockedFs.stat.mockReturnValueOnce(returnValue)
	);

	mockedFs.rm.mockReset();
	mockedFs.rm.mockResolvedValue();

	let oldestTime = (await fsStatsMockReturnValue[0]).ctimeMs + 1;
	let logs = await removeOldDirsInStorageSubdirectory('images/wallpaper', oldestTime);
	let regExpTxt = (await fsReadDirMockReturnValue)
		.map((dir) => {
			return `\\n.+${dir}`;
		})
		.join('')
		.replace(/\\n/g, '\\n')
		.replace(/[(]/g, '\\(')
		.replace(/[)]/g, '\\)');
	expect(logs[0]).toMatch(new RegExp(regExpTxt));
	expect(logs[1]).toBe('');

	mockedFs.stat.mockReset();
	fsStatsMockReturnValue.map((returnValue) => {
		return mockedFs.stat.mockReturnValueOnce(returnValue);
	});
	mockedFs.rm.mockRejectedValueOnce(new Error('No file mock error.'));
	logs = await removeOldDirsInStorageSubdirectory('images/wallpaper', oldestTime);
	regExpTxt = (await fsReadDirMockReturnValue)
		.map((dir, idx) => {
			if (idx === 0) return '';
			return `\\n.+${dir}`;
		})
		.join('')
		.replace(/\\n/g, '\\n')
		.replace(/[(]/g, '\\(')
		.replace(/[)]/g, '\\)');

	expect(logs[0]).toMatch(new RegExp(regExpTxt));
	expect(logs[1]).not.toBe('');

	mockedFs.readdir.mockRejectedValue(new Error('Could not read dir / mock error.'));
	logs = await removeOldDirsInStorageSubdirectory('images/wallpaper', oldestTime);
	expect(logs[0]).toBe('');
	expect(logs[1]).toMatch(
		new RegExp('\nDir: images/wallpaper Error:\nCould not read dir / mock error.')
	);
});
