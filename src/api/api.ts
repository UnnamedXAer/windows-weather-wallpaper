import axios from 'axios';
import { readFileSync } from 'fs';
import { config } from '../config';
import { getAssetsPath } from '../files';
import consoleLog from '../utils/consoleLogger';
import { CurrentWeather, ForecastWeather, Geolocation } from '../types/types';

export const fetchWeatherData = async (loc: Geolocation | null) => {
	if (loc === null) {
		throw new Error('Unable to fetch weather data - missing location.');
	}
	const weatherData = await Promise.all([
		fetchCurrentWeather(loc),
		fetchForecastWeather(loc)
	]);
	consoleLog('Weather data fetched.');
	return weatherData;
};

export const fetchCurrentWeather = async (loc: Geolocation) => {
	const payload = {
		provider: 'openweathermap',
		queryParams: {
			endPoint: 'weather', // forecast
			units: 'metric',
			lang: 'en',
			loc: {
				city: loc.city,
				latitude: loc.lat,
				longitude: loc.lng,
				countryCode: loc.country
			}
		}
	};
	const url = config.weatherApiUrl;
	try {
		if (config.isDev) {
			const currentWeather = JSON.parse(
				readFileSync(
					getAssetsPath('data', 'current-weather-example-1.json')
				).toString()
			);
			return currentWeather as CurrentWeather;
		}
		const { data } = await axios.post(url, payload);
		return data as CurrentWeather;
	} catch (err) {
		consoleLog('Fail to fetch current weather.', err);
		return null;
	}
};

export const fetchForecastWeather = async (loc: Geolocation) => {
	const payload = {
		provider: 'openweathermap',
		queryParams: {
			endPoint: 'forecast',
			units: 'metric',
			lang: 'en',
			loc: {
				city: loc.city,
				latitude: loc.lat,
				longitude: loc.lng,
				countryCode: loc.country
			}
		}
	};
	const url = config.weatherApiUrl;
	try {
		if (config.isDev) {
			const forecastData = JSON.parse(
				readFileSync(
					getAssetsPath('data', 'forecast-weather-example-1.json')
				).toString()
			);
			return forecastData as ForecastWeather;
		}
		const { data } = await axios.post(url, payload);
		return data as ForecastWeather;
	} catch (err) {
		consoleLog('Fail to fetch current weather.', err);
		return null;
	}
};

export const fetchMyGeolocation = async () => {
	try {
		if (config.isDev) {
			const geolocation = JSON.parse(
				readFileSync(getAssetsPath('data', 'location-example-1.json')).toString()
			);
			return geolocation as Geolocation;
		}
		const url = config.locationApiUrl;
		const { data } = await axios.get(url, {});
		return data && data.location ? (data.location as Geolocation) : null;
	} catch (err) {
		consoleLog('Fail to fetch geolocation.', err);
		return null;
	}
};
