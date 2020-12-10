import { NODE_ENV } from '../types/types';
import { validateEnvParams } from '../utils/validateEnvParams';

const env = { ...process.env };
beforeEach(() => {
	process.env.WEATHER_API_URL = 'https://my-api.com';
	process.env.LOCATION_API_URL = 'https://my-api.com';
});

afterEach(() => {
	process.env = env;
});

test('should check if NODE_ENV has allowed value', async () => {
	process.env.NODE_ENV = 'test';
	expect(validateEnvParams()).toBeUndefined();
	process.env.NODE_ENV = 'production';
	expect(validateEnvParams()).toBeUndefined();
	process.env.NODE_ENV = 'development';
	expect(validateEnvParams()).toBeUndefined();

	process.env.NODE_ENV = '' as NODE_ENV;
	try {
		expect(validateEnvParams()).toBe(123);
	} catch (err) {
		expect(err.message).toMatch(/Environment\. Invalid invalid env = ""\./);
	}

	process.env.NODE_ENV = (undefined as unknown) as NODE_ENV;
	try {
		expect(validateEnvParams()).toBe(123);
	} catch (err) {
		expect(err.message).toMatch(/Environment\. Invalid invalid env = "undefined"\./);
	}
});

test('should should check if the weather api url is set.', () => {
	expect(validateEnvParams()).toBeUndefined();

	process.env.WEATHER_API_URL = (undefined as unknown) as NODE_ENV;
	try {
		expect(validateEnvParams()).toBe(123);
	} catch (err) {
		expect(err.message).toBe('Environment. Missing weather api url.');
	}
});

test('should should check if the location api url is set.', () => {
	expect(validateEnvParams()).toBeUndefined();

	process.env.LOCATION_API_URL = (undefined as unknown) as NODE_ENV;
	try {
		expect(validateEnvParams()).toBe(123);
	} catch (err) {
		expect(err.message).toBe('Environment. Missing location api url.');
	}
});
