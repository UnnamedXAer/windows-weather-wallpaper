import fs from 'fs/promises';
import { mocked } from 'ts-jest/utils';
import wallpaper from 'wallpaper';
import Jimp from 'jimp';
import {
	copyFile,
	ensurePathExists,
	getSettingsPath,
	getStoragePath,
	makeDefaultWallpaperCopy,
	readSettings,
	saveAndOpenLog,
	saveDefaultWallpaperCopy,
	saveLog,
	saveSettings,
	updateWallpaperSize
} from '../files';
import { openInDefaultApp } from '../processes';
import { Settings } from '../types/types';

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

test('should create dir if not exists and return dir', async () => {
	const existingPath = '../../src/__tests__';
	const notExistingPath = '../../src/__tests__/very-not-existing-path2';

	const returnPath = await ensurePathExists(existingPath);
	expect(returnPath).toMatch(existingPath);

	mockedFs.access.mockReturnValueOnce(Promise.reject('Dir does not exists.'));
	await ensurePathExists(notExistingPath);

	expect(fs.access).toHaveBeenCalledTimes(2);
	expect(fs.mkdir).toHaveBeenCalledTimes(1);
});

test('should return path to storage dir inside src with env prefix', async () => {
	expect(await getStoragePath('settings')).toMatch(/.\\src\\storage\\test\\settings$/);
	expect(await getStoragePath('images/default-wallpaper')).toMatch(
		/.\\src\\storage\\test\\images\\default-wallpaper$/
	);
	expect(await getStoragePath('images/wallpaper')).toMatch(
		/.\\src\\storage\\test\\images\\wallpaper$/
	);
	expect(await getStoragePath('images/weather')).toMatch(
		/\\src\\storage\\test\\images\\weather$/
	);
	expect(await getStoragePath('test-data')).toMatch(/.\\src\\storage\\test-data$/);

	const storagePath = await getStoragePath('test-data', 'def-wallpaper.jpg');
	expect(storagePath).toMatch(/\\src\\storage\\test-data\\def-wallpaper[.]jpg$/);
});

test('should copy file', async () => {
	mockedFs.copyFile.mockResolvedValue(Promise.resolve());

	const res = await copyFile(
		await getStoragePath('test-data', 'def-wallpaper.jpg'),
		await getStoragePath('test-data', 'def-wallpaper-jest.jpg')
	);

	await copyFile(
		await getStoragePath('test-data', 'def-wallpaper.jpg'),
		await getStoragePath('test-data', 'def-wallpaper-jest2.jpg')
	);

	expect(res).toBeUndefined();
	expect(mockedFs.copyFile).toBeCalledTimes(2);
});

test('should return path and name of the settings file', async () => {
	const { settingsFileName, settingsPath } = await getSettingsPath();
	expect(settingsFileName).toMatch(/pc[.]test-settings[.]json$/);
	expect(settingsPath).toMatch(/\\src\\storage\\test\\settings$/);
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
	const exampleName = 'waterfall.png';
	const examplePath = `X://my-wallpapers/${exampleName}`;

	mockedFs.copyFile.mockClear();
	mockedFs.access.mockClear();
	mockedFs.access
		.mockResolvedValueOnce()
		.mockRejectedValueOnce(new Error('Dir does not exists.'));

	wallpaperCopyPath = await makeDefaultWallpaperCopy(examplePath);

	expect(wallpaperCopyPath).toMatch(new RegExp(`\\\\def-wallpaper-${exampleName}$`));
	expect(mockedFs.access).toBeCalledTimes(3);
	expect(mockedFs.copyFile).toBeCalledTimes(1);

	mockedFs.copyFile.mockClear();
	mockedFs.access.mockClear();

	wallpaperCopyPath = await makeDefaultWallpaperCopy(examplePath);

	expect(wallpaperCopyPath).toMatch(new RegExp(`\\\\def-wallpaper-${exampleName}$`));
	expect(mockedFs.access).toBeCalledTimes(2);
	expect(mockedFs.copyFile).toBeCalledTimes(0);
});

test('should ', async () => {
	const exampleName = 'waterfall.png';
	const examplePath = `X://my-wallpapers/${exampleName}`;
	mockedWallpaper.get.mockResolvedValue(examplePath);

	let settings = await saveDefaultWallpaperCopy({
		...DEFAULT_SETTINGS
	});

	expect(settings.defaultWallpaperPath).toBe(examplePath);
	expect(settings.wallpaperCopyPath).not.toBeNull;

	settings = await saveDefaultWallpaperCopy({ ...settings, wallpaperCopyPath: null });

	expect(settings.wallpaperCopyPath).not.toBeNull;

	settings = await saveDefaultWallpaperCopy(settings);

	expect(settings.wallpaperCopyPath).not.toBeNull;
});

test('should update the settings with the wallpaper size', async () => {
	const examplePath = 'X://project-path-wallpapers/waterfall.png';

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
		wallpaperCopyPath: examplePath
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
