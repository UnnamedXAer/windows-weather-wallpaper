import { setupSettings, updateStoredSettings } from '../settings';
import fs from 'fs/promises';
import axios from 'axios';
import jimp from 'jimp';
import wallpaper from 'wallpaper';
import { mocked } from 'ts-jest/utils';
import { config } from '../config';
import { Settings } from '../types/types';

jest.mock('fs/promises');
jest.mock('axios');
jest.mock('jimp');
jest.mock('wallpaper');
const mockedFs = mocked(fs);
const mockedWallpaper = mocked(wallpaper);
const defaultSettings: Settings = {
	dt: new Date().toISOString(),
	defaultWallpaperPath: config.defaultWallpaperPath,
	wallpaperCopyPath: null,
	wallpaperSize: null,
	location: null
};

const exampleDefaultWallpaperPath = 'X://my-wallpapers/wallpaper.png';
mockedFs.readFile.mockResolvedValue(JSON.stringify(defaultSettings));
mockedWallpaper.get.mockResolvedValue(exampleDefaultWallpaperPath);

test('should merge given settings with old one and save them', async () => {
	const exampleWallpaperSize = { width: 12, height: 12 };
	const settings = await updateStoredSettings({
		wallpaperSize: exampleWallpaperSize
	});

	expect(mockedFs.readFile).toBeCalledTimes(1);
	expect(mockedFs.writeFile).toBeCalledTimes(1);

	expect(settings).toMatchObject({
		...defaultSettings,
		wallpaperSize: exampleWallpaperSize,
		dt: expect.any(String)
	});

	mockedFs.readFile.mockRejectedValueOnce('Direction does not exists / Mock Error');
	mockedFs.writeFile.mockReset();
	expect(
		await updateStoredSettings({
			...defaultSettings,
			wallpaperSize: exampleWallpaperSize
		})
	).toMatchObject({
		...defaultSettings,
		wallpaperSize: exampleWallpaperSize,
		dt: expect.any(String)
	});
	expect(mockedFs.writeFile).toBeCalledTimes(1);

	mockedFs.writeFile.mockReset();
	mockedFs.writeFile.mockRejectedValueOnce(
		new Error('Direction does not exists / Mock Error')
	);

	expect(
		await updateStoredSettings({
			...defaultSettings,
			wallpaperSize: exampleWallpaperSize
		})
	).toBeNull();

	expect(mockedFs.writeFile).toBeCalledTimes(1);
});

test('should setup the settings', async () => {
	console.log('-debug');
	let settings = await setupSettings();

	expect(settings).toMatchObject({
		...defaultSettings,
		dt: expect.any(String),
		defaultWallpaperPath: exampleDefaultWallpaperPath,
		wallpaperCopyPath: expect.any(String),
		wallpaperSize: expect.any(Object),
		location: expect.any(Object)
	});

	mockedFs.readFile.mockResolvedValueOnce(
		JSON.stringify({
			...defaultSettings,
			defaultWallpaperPath: exampleDefaultWallpaperPath,
			wallpaperCopyPath: exampleDefaultWallpaperPath + 'j',
			wallpaperSize: { width: 200, height: 200 }
		} as Settings)
	);

	settings = await setupSettings();

	expect(settings).toMatchObject({
		...defaultSettings,
		dt: expect.any(String),
		defaultWallpaperPath: exampleDefaultWallpaperPath,
		wallpaperCopyPath: expect.any(String),
		wallpaperSize: expect.any(Object),
		location: expect.any(Object)
	});

	mockedFs.readFile.mockRejectedValueOnce(
		new Error('The directory does not exists / Mock error.')
	);

	settings = await setupSettings();

	expect(settings).toMatchObject({
		...defaultSettings,
		dt: expect.any(String),
		defaultWallpaperPath: exampleDefaultWallpaperPath,
		wallpaperCopyPath: expect.any(String),
		wallpaperSize: expect.any(Object),
		location: expect.any(Object)
	});

	mockedFs.writeFile.mockRejectedValue('Missing permissions / Mock error');
	settings = await setupSettings();
	// const configDefaultWallpaper = config.defaultWallpaperPath;
	// config.defaultWallpaperPath = exampleDefaultWallpaperPath;
	// config.defaultWallpaperPath = configDefaultWallpaper;

	expect(settings).not.toBeNull();
});
