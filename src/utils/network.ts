import axios from 'axios';
import { readFileSync } from 'fs';
import { readFile } from 'fs';
import { config } from '../config';
import emitter from '../events/emitter';
import { NO_LOCATION } from '../events/eventsTypes';
import { getAssetsPath } from '../files';
import consoleLog from '../logger/consoleLogger';
import { CurrentWeather, ForecastWeather, Geolocation } from '../types/types';
import { formatDate } from './formatDate';

export const fetchCurrentWeather = async () => {
	const loc = await fetchMyGeolocation();
	consoleLog(loc);
	if (loc === null) {
		emitter.emit(NO_LOCATION, 'Location is null');
		return;
	}

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
		consoleLog(formatDate(Date.now()));
		if (config.isDev) {
			return {
				weatherData: {
					dt: 1606831101000,
					imgName: '04d',
					temperature: { main: 0.39, feelsLike: -6.37, min: 0, max: 0.56 },
					pressure: 1022,
					humidity: 93,
					wind: { speed: 6.7, deg: 110 },
					time: 1606831101000,
					sunrise: 1606802957000,
					sunset: 1606833185000,
					visibility: 10000,
					description: 'overcast clouds',
					shortDescription: 'Clouds',
					clouds: 90
				},
				location: {
					id: 761968,
					city: 'Pobitno',
					latitude: 50.03,
					longitude: 22.04
				}
			} as CurrentWeather;
		}
		const { data } = await axios.post(url, payload);
		return data as CurrentWeather;
	} catch (err) {
		consoleLog('Fail to fetch current weather.', err);
		return null;
	}
};

export const fetchForecastWeather = async () => {
	const loc = await fetchMyGeolocation();
	consoleLog(loc);
	if (loc === null) {
		emitter.emit(NO_LOCATION, 'Location is null');
		return;
	}

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
		consoleLog(formatDate(Date.now()));
		if (config.isDev) {
			const forecastData = JSON.parse(
				readFileSync(getAssetsPath('data', 'forecast-example-1.json')).toString()
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

const fetchMyGeolocation = async () => {
	try {
		if (config.isDev) {
			return {
				country: 'PL',
				region: 'Subcarpathian',
				city: 'Rzeszów (Nowe Miasto)',
				lat: 50.0324,
				lng: 22.0418,
				postalCode: '35-615',
				timezone: '+01:00',
				geonameId: 759734
			} as Geolocation;
		}
		const url = config.locationApiUrl;
		const { data } = await axios.get(url, {});
		return data && data.location ? (data.location as Geolocation) : null;
	} catch (err) {
		consoleLog('Fail to fetch geolocation.', err);
		return null;
	}
};
