import axios from 'axios';
// import fs from 'fs/promises';
import { mocked } from 'ts-jest/utils';
import {
	fetchCurrentWeather,
	fetchForecastWeather,
	fetchMyGeolocation,
	fetchWeatherData
} from '../../api';
import { config } from '../../config';
import {
	CurrentWeather,
	ForecastWeather,
	Geolocation,
	Temperature,
	WeatherData,
	WeatherLocation,
	Wind
} from '../../types/types';

jest.mock('axios');
const mockedAxios = mocked(axios, true);

describe('test fetching the computer location info', () => {
	const locationMatchObject: Geolocation = {
		city: expect.any(String),
		country: expect.any(String),
		postalCode: expect.any(String),
		timezone: expect.any(String),
		region: expect.any(String),
		geonameId: expect.any(Number),
		lat: expect.any(Number),
		lng: expect.any(Number)
	};

	test('should fetch location', async () => {
		const isDev = config.isDev;

		config.isDev = true;
		const testLocation = await fetchMyGeolocation();
		expect(testLocation).toMatchObject<Geolocation>(locationMatchObject);

		config.isDev = false;
		let loc = await fetchMyGeolocation();
		expect(loc).toBeNull();

		const locationApiUrl = config.locationApiUrl;
		config.locationApiUrl = 'https://my-location-api-url-123.com/here';

		loc = await fetchMyGeolocation();
		expect(loc).toBeNull();

		mockedAxios.get.mockResolvedValueOnce({ data: null });
		loc = await fetchMyGeolocation();
		expect(loc).toBeNull();

		mockedAxios.get.mockResolvedValueOnce({ data: {} });
		loc = await fetchMyGeolocation();
		expect(loc).toBeNull();

		mockedAxios.get.mockResolvedValueOnce({ data: { location: null } });
		loc = await fetchMyGeolocation();
		expect(loc).toBeNull();

		mockedAxios.get.mockResolvedValueOnce({ data: { location: testLocation } });
		loc = await fetchMyGeolocation();
		expect(loc).toMatchObject(locationMatchObject);

		config.locationApiUrl = locationApiUrl;
		config.isDev = isDev;
	});
});

describe('test fetching weather data', () => {
	const configWeatherApiUrl = config.weatherApiUrl;
	const isDev = config.isDev;

	let testLocation: Geolocation;

	beforeAll(async () => {
		testLocation = (await fetchMyGeolocation()) as Geolocation;
		config.weatherApiUrl = 'https://my-weather-api-url.com/info';
	});

	afterAll(() => {
		config.weatherApiUrl = configWeatherApiUrl;
	});

	beforeEach(() => {
		config.isDev = true;
	});

	afterEach(() => {
		config.isDev = isDev;
		mockedAxios.get.mockReset();
		mockedAxios.post.mockReset();
	});

	const temperatureMatchObject = {
		feelsLike: expect.any(Number),
		main: expect.any(Number),
		max: expect.any(Number),
		min: expect.any(Number)
	} as Temperature;

	const windMatchObject = {
		deg: expect.any(Number),
		speed: expect.any(Number)
	} as Wind;

	const weatherDataMatchObject: WeatherData = {
		imgName: expect.any(String),
		temperature: temperatureMatchObject,
		pressure: expect.any(Number),
		humidity: expect.any(Number),
		wind: windMatchObject,
		time: expect.any(Number),
		clouds: expect.any(Number),
		description: expect.any(String),
		shortDescription: expect.any(String)
	};

	const weatherLocationMatchObject: WeatherLocation = {
		city: expect.any(String),
		longitude: expect.any(Number),
		latitude: expect.any(Number)
	};

	const currentWetherMatchObject: CurrentWeather = {
		weatherData: {
			...weatherDataMatchObject,
			dt: expect.any(Number),
			sunrise: expect.any(Number),
			sunset: expect.any(Number),
			visibility: expect.any(Number)
		},

		location: weatherLocationMatchObject
	};

	const sunMatchObject = {
		sunrise: expect.any(Number),
		sunset: expect.any(Number)
	};

	const forecastWeatherMatchObject: ForecastWeather = {
		weatherData: expect.arrayContaining<WeatherData>([weatherDataMatchObject]),
		linesCnt: expect.any(Number),
		location: weatherLocationMatchObject,
		sun: sunMatchObject
	};

	test('should fetch current weather', async () => {
		const testWeatherInfo = await fetchCurrentWeather(testLocation);
		expect(testWeatherInfo).toMatchObject(currentWetherMatchObject);

		mockedAxios.post.mockResolvedValue({ data: testWeatherInfo });

		config.isDev = false;

		mockedAxios.post.mockRejectedValueOnce(new Error('Network error / mock error.'));
		let currentWeather = await fetchCurrentWeather(testLocation);
		expect(currentWeather).toBeNull();

		currentWeather = await fetchCurrentWeather(testLocation);
		expect(currentWeather).toMatchObject(currentWetherMatchObject);
	});

	test('should fetch forecast weather', async () => {
		const testWeatherInfo = await fetchForecastWeather(testLocation);
		expect(testWeatherInfo).toMatchObject(forecastWeatherMatchObject);

		mockedAxios.post.mockResolvedValue({ data: testWeatherInfo });

		config.isDev = false;

		mockedAxios.post.mockRejectedValueOnce(new Error('Network error / mock error.'));
		let forecastWeather = await fetchForecastWeather(testLocation);
		expect(forecastWeather).toBeNull();

		forecastWeather = await fetchForecastWeather(testLocation);
		expect(forecastWeather).toMatchObject(forecastWeatherMatchObject);
	});

	test('should the fetch weather data', async () => {
		expect(fetchWeatherData(null)).rejects.toThrowError(
			'Unable to fetch weather data - missing location.'
		);

		let weatherData = await fetchWeatherData(testLocation);

		expect(weatherData).toMatchObject([
			currentWetherMatchObject,
			forecastWeatherMatchObject
		]);

		config.isDev = false;
		mockedAxios.post.mockRejectedValue('Network error / mock data');

		weatherData = await fetchWeatherData(testLocation);
		expect(weatherData).toMatchObject([null, null]);
	});
});
