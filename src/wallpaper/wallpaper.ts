import path from 'path';
import wallpaper from 'wallpaper';
// require instead of import to fix tsc complaints about missing puppeteer .d.ts
const nodeHtmlToImage = require('node-html-to-image');
import { CurrentWeather, ForecastWeather } from '../types/types';
import { ensurePathExists, getAssetsPath, readSettings } from '../files';
import Jimp from 'jimp';
import { formatDate } from '../utils/formatDate';
import consoleLog from '../utils/consoleLogger';
import findNextFileName from 'find-next-file-name';
import { addUnits } from '../utils/units';
import { config } from '../config';

export async function createWallpaper(
	weatherData: [CurrentWeather | null, ForecastWeather | null] | null
) {
	const [currentWeather, forecastWeather] = weatherData || [null, null];
	const currentWeatherHtml = await createCurrentWeatherHtml(currentWeather);
	const forecastWeatherHtml = await createForecastWeatherHtml(forecastWeather);

	const weatherHtml = await createWeatherHtml(currentWeatherHtml, forecastWeatherHtml);
	if (config.isDev) {
		require('child_process').spawn('clip').stdin.end(weatherHtml);
		consoleLog('html copied!');
	}

	const weatherImgPath = await createWeatherImg(weatherHtml);

	const newWallpaper = await addWeatherImagesToWallpaper(weatherImgPath);

	return newWallpaper;
}

async function createCurrentWeatherHtml(currentWeather: CurrentWeather | null) {
	if (currentWeather === null) {
		return `<div class="container"><h4>No current weather data / ${new Date().toLocaleString(
			'en-US'
		)}</h4></div>`;
	}

	const { weatherData } = currentWeather;
	const html = `
	<div class="card current-tile">
	<h1>Current Weather</h1>
	<div>
		<p>Current temperature: <strong style="font-size: 1.7em">
				${addUnits(weatherData.temperature.main)}
			</strong>
		</p>
		<p>
			Feels Like: <strong>${addUnits(weatherData.temperature.feelsLike)}</strong>
		</p>
	</div>
	<div data-tip="${weatherData.description}">
		<img src="http://openweathermap.org/img/wn/${weatherData.imgName}@2x.png"
			alt="${weatherData.shortDescription}" />
	</div>
	<table class="current-weather-table">
		<tr>
			<td>Wind</td>
			<td>${weatherData.wind.speed} m/s</td>
		</tr>
		<tr>
			<td>Clouds</td>
			<td>${weatherData.clouds}%</td>
		</tr>
		<tr>
			<td>Cloudiness</td>
			<td>${weatherData.description}</td>
		</tr>
		<tr>
			<td>Pressure</td>
			<td>${weatherData.pressure} hpa</td>
		</tr>
		<tr>
			<td>Humidity</td>
			<td>${weatherData.humidity}%</td>
		</tr>
		<tr>
			<td>Sunrise</td>
			<td>${new Date(weatherData.sunrise).toLocaleTimeString('en-US')}
			</td>
		</tr>
		<tr>
			<td style="padding-left: 8px; border-bottom: 1px solid green;">Sunset</td>
			<td style="padding-left: 8px; border-bottom: 1px solid green;">${new Date(
				weatherData.sunset
			).toLocaleTimeString('en-US')}</td>
		</tr>
	</table>
	<p>Data forecasted at: ${new Date(currentWeather.weatherData.dt).toLocaleString(
		'en-US'
	)}</p>
</div>
		`;
	consoleLog('Current weather html created.');
	return html;
}

async function createForecastWeatherHtml(forecastWeather: ForecastWeather | null) {
	if (forecastWeather === null) {
		return '<div>missing forecast data</div>';
	}

	const { weatherData } = forecastWeather;
	const weatherTiles: string[] = [];
	weatherData.forEach((weather) => {
		const weatherTime = new Date(weather.time);
		if (weatherTime.getHours() > 11 && weatherTime.getHours() < 14) {
			const prettyTime = weatherTime
				.toLocaleString('en-US', {
					weekday: 'long',
					month: 'long',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				})
				.split(', ')
				.join('<br>');

			weatherTiles.unshift(`
			<div class="card forecast-tile">
			<p style="font-size: 0.9em; margin-block-end: 0em; margin-block-start: 0.5em;">${prettyTime}</p>
			<div>
				<p style="font-size: 1.3em"><strong>${addUnits(weather.temperature.main)}</strong></p>
				<p style="font-size: 0.8em; margin-block-end: 0em;">Feels Like: <strong>${addUnits(
					weather.temperature.feelsLike
				)}</strong>
				</p>
			</div>
			<div style="margin: 0 auto;">
				<img src="http://openweathermap.org/img/wn/${weather.imgName}@2x.png" alt="${
				weather.shortDescription
			}" />
				<p style="margin-block-start: 0em; margin-block-end: 0em;">clouds: ${weather.clouds}%</p>
			</div>
		</div>
		`);
		}
	});
	consoleLog('Forecast html created, number of tiles:', weatherTiles.length);

	const forecastHtml = `
	<div class="forecast">
	<h1>Forecast weather</h1>
	<div style="display: flex; flex-direction: row-reverse;">
		${weatherTiles.join('')}
	</div>
</div>
	`;
	return forecastHtml;
}

async function createWeatherHtml(
	currentWeatherHtml: string,
	forecastWeatherHtml: string
) {
	const size = { width: 1300, height: 900 };
	try {
		const settings = await readSettings();
		if (!settings || !settings.wallpaperSize) {
			throw new Error('Missing wallpaper size.');
		}
		size.width = settings.wallpaperSize.width;
		size.height = settings.wallpaperSize.height;
	} catch (err) {
		consoleLog('Missing wallpaper size.', err);
		throw err;
	}
	const weatherHtml = `
	<!DOCTYPE html>
	<html lang="en">
	
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Weather info</title>
	
		<style>
		body {
			width: ${size.width}px;
			height: ${size.height - 20}px;
			padding-top: 20px;
		}

			.main {
				width: 100%;
				height: 100%;
				color: rgb(255, 200, 47);
				background-color: transparent;
				display: flex;
				flex-direction: column;
				align-items: center;
			}
	
			.card {
				margin: 8px;
				padding: 8px;
				background-color: rgba(95, 158, 160, 0.3);
				border: 10px solid rgba(95, 158, 160, 0.5);
				text-align: center;
				display: flex;
				align-items: center;
				flex-direction: column;
			}
	
			.current-tile {
				margin-left: 24px;
				margin-right: 24px;
			}
	
			.current-weather-table {
				margin: auto auto;
				font-size: 1.1em;
				color: rgb(255, 217, 0);
			}
	
			.current-weather-table td {
				padding-bottom: 8px;
			}
	
			.current-weather-table tr td:first-of-type {
				text-align: right;
				padding-right: 12px;
			}
	
			.current-weather-table tr td:last-of-type {
				text-align: left;
				padding-left: 12px;
			}
	
			.forecast {
				color: rgb(255, 200, 47);
				display: flex;
				flex-direction: column;
				align-items: center;
				text-align: center;
			}
	
			.forecast-tile {
				width: 150px;
			}
		</style>
	
	</head>
	
	<body>
		<div class="main">
			${currentWeatherHtml}${forecastWeatherHtml}
		</div>
	</body>
	
	</html>
	`;
	consoleLog('Weather html created.')
	return weatherHtml;
}

async function createWeatherImg(weatherHtml: string) {
	const assetsImagesOutputPath = getAssetsPath('images-output');
	const weatherImgName = findNextFileName(
		assetsImagesOutputPath,
		`weather-img-${formatDate()}.png`
	);

	const weatherImgPath = path.join(assetsImagesOutputPath, weatherImgName);
	try {
		await ensurePathExists(assetsImagesOutputPath);
		await nodeHtmlToImage({
			html: weatherHtml,
			type: 'png',
			encoding: 'binary',
			output: weatherImgPath,
			transparent: true
		});
		consoleLog('The new weather image created.');
		return weatherImgPath;
	} catch (err) {
		consoleLog('Fail to generate weather image.', err);
		throw err;
	}
}

async function addWeatherImagesToWallpaper(weatherImgPath: string) {
	const imagesPath = getAssetsPath('images');
	try {
		await ensurePathExists(imagesPath);
		const settings = await readSettings();
		if (!settings || !settings.wallpaperCopyPath) {
			throw new Error(
				`Missing ${settings ? 'path to copy of wallpaper' : 'settings'}.`
			);
		}
		const myWallpaperPath = path.normalize(settings.wallpaperCopyPath);

		const myWallpaper = (await Jimp.read(myWallpaperPath)).clone();
		const weatherJimpImg = await Jimp.read(weatherImgPath);

		const myWallPaperWithWeather = myWallpaper.composite(weatherJimpImg, 0, 0, {
			opacitySource: 0.9,
			mode: Jimp.BLEND_OVERLAY,
			opacityDest: 0.1
		});
		consoleLog('The weather info image added to the wallpaper');
		return myWallPaperWithWeather;
	} catch (err) {
		consoleLog('Fail to add weather img to the wallpaper.', err);
		throw err;
	}
}

export async function saveWallpaper(image: Jimp) {
	const imgOutputPath = getAssetsPath('images-output');
	await ensurePathExists(imgOutputPath);
	const imageName = findNextFileName(
		imgOutputPath,
		`wallpaper-${formatDate(new Date())}.${image.getExtension()}`
	);
	const imgPath = path.join(imgOutputPath, imageName);
	try {
		await image.writeAsync(imgPath);
		consoleLog('The new wallpaper image saved', imgPath);
		return imgPath;
	} catch (err) {
		consoleLog('Fail to save updated wallpaper.', err);
		throw err;
	}
}

export function setWallpaper(wallpaperPath: string) {
	try {
		consoleLog('About to set the new windows wallpaper.');
		wallpaper.set(wallpaperPath);
		consoleLog('The Wallpaper set.');
	} catch (err) {
		consoleLog('Fail to set wallpaper', err);
		throw err;
	}
}
