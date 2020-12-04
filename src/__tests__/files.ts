import fs from 'fs/promises';
import { mocked } from 'ts-jest/utils';
import { copyFile, ensurePathExists, getStoragePath, saveLog } from '../files';
jest.mock('fs/promises');
const mockedFs = mocked(fs, true);
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
	expect(storagePath).toMatch(
		/\\src\\storage\\test-data\\def-wallpaper[.]jpg$/
	);
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

test('should write text to log file and return path base on type parameter.', async () => {
	let logPath = await saveLog('My text', 'error');
	expect(logPath).toMatch(/\\logs\\log-error-[\d]{4}(-\d\d){2}[.]log$/);

	logPath = await saveLog('My text', 'default');
	expect(logPath).toMatch(/\\logs\\log-[\d]{4}(-\d\d){2}[.]log$/);

	logPath = await saveLog('My text');
	expect(logPath).toMatch(/\\logs\\log-[\d]{4}(-\d\d){2}[.]log$/);

	expect(fs.writeFile).toBeCalledTimes(3);
});
