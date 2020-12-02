import path from 'path';
import wallpaper from 'wallpaper';
import nodeHtmlToImage from 'node-html-to-image';
import { CurrentWeather, ForecastWeather } from '../types/types';
import { ensurePathExists, getAssetsPath } from '../files';
import Jimp from 'jimp';
import { formatDate } from '../utils/formatDate';
import consoleLog from '../utils/consoleLogger';
import findNextFileName from 'find-next-file-name';
import { addUnits } from '../utils/units';

export async function createWallpaper(
	weatherData: [CurrentWeather | null, ForecastWeather | null] | null
) {
	const [currentWeather, forecastWeather] = weatherData || [null, null];
	const currentWeatherHtml = await createCurrentWeatherHtml(currentWeather);
	const forecastWeatherHtml = await createForecastWeatherHtml(forecastWeather);

	const weatherImg = await createWeatherImg(currentWeatherHtml, forecastWeatherHtml);

	const newWallpaper = await addWeatherImagesToWallpaper(weatherImg);

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
	<div style="color: rgb(255, 217, 0); width: 350px; height: 500px; background-color: #5f9ea0; text-align: center; display: inline-block;">
	<H1>Current Weather</H1>
	<DIV>
		<div>
			<p>Current temperature: <strong style="font-size: 1.7em">
					${addUnits(weatherData.temperature.main)}
				</strong>
			</p>
			<p>
				Feels Like: <strong>${addUnits(weatherData.temperature.feelsLike)}</strong>
			</p>
		</div>
		<div className="weather-today__icon" data-tip="${weatherData.description}">
			<img src="http://openweathermap.org/img/wn/${weatherData.imgName}@2x.png"
				alt="${weatherData.shortDescription}" />
		</div>
		<table style=" font-size: 1.1em; color:rgb(255, 217, 0);">
			<tr>
				<td style="border-bottom: 1px solid green;">Wind</td>
				<td style="border-bottom: 1px solid green;">${weatherData.wind.speed} m/s</td>
			</tr>
			<tr>
				<td style="border-bottom: 1px solid green;">Clouds</td>
				<td style="border-bottom: 1px solid green;">${weatherData.clouds}%</td>
			</tr>
			<tr>
				<td style="border-bottom: 1px solid green;">Cloudiness</td>
				<td style="border-bottom: 1px solid green;">${weatherData.description}</td>
			</tr>
			<tr>
				<td style="border-bottom: 1px solid green;">Pressure</td>
				<td style="border-bottom: 1px solid green;">${weatherData.pressure} hpa</td>
			</tr>
			<tr>
				<td style="border-bottom: 1px solid green;">Humidity</td>
				<td style="border-bottom: 1px solid green;">${weatherData.humidity}%</td>
			</tr>
			<tr>
				<td style="border-bottom: 1px solid green;">Sunrise</td>
				<td style="border-bottom: 1px solid green;">${new Date(
					weatherData.sunrise
				).toLocaleString('en-US')}
				</td>
			</tr>
			<tr>
				<td style="border-bottom: 1px solid green;">Sunset</td>
				<td style="border-bottom: 1px solid green;">${new Date(weatherData.sunset).toLocaleString(
					'en-US'
				)}</td>
			</tr>
		</table>
	</DIV>
	<p className="weather-today-details__date">Data forecasted at: ${new Date(
		currentWeather.weatherData.dt
	).toLocaleString('en-US')}</P>
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
			weatherTiles.push(`
			<div
			style="color:rgb(255, 200, 47); background-color: steelblue; margin: 8px; border: 1px dashed darkblue; display: inline-block; text-align: center;">
			<p style="font-size: 0.9em;">${weatherTime.toLocaleString('en-US')}</p>
			<div style="margin: 0 auto;">
				<img src="http://openweathermap.org/img/wn/${weather.imgName}@2x.png" alt="${
				weather.shortDescription
			}" />
				<p style="font-size: 0.7em">clouds: ${weather.clouds}%</p>
			</div>
			<div>
				<p style="font-size: 1.1em"><strong>${addUnits(weather.temperature.main)}</strong></p>
				<p style="font-size: 0.7em">Feels Like: <br /><strong>${addUnits(
					weather.temperature.feelsLike
				)}</strong></p>
			</div>
		</div>
		`);
		}
	});
	consoleLog('Forecast html created, number of tiles:', weatherTiles.length);

	// return html;
	return weatherTiles.join('');
}

async function createWeatherImg(currentWeatherHtml: string, forecastWeatherHtml: string) {
	const weatherHtml = `<div style="background: transparent; background-color: #5f9ea0; border: 2px solid #1fb8ff; max-width: 1000px; display: flex;
    justify-content: center;
    align-items: center;">
	${currentWeatherHtml}${forecastWeatherHtml}
	</div>`;
	const weatherImg = await nodeHtmlToImage({
		html: weatherHtml,
		type: 'jpeg',
		encoding: 'binary',
		transparent: true
	});
	if (weatherImg === null) {
		throw new Error('Fail to generate weather image.');
	}
	return Buffer.from(weatherImg);
}

async function addWeatherImagesToWallpaper(weatherImg: Buffer) {
	const imagesPath = getAssetsPath('images');
	try {
		await ensurePathExists(imagesPath);
		const myWallpaperPath = path.join(imagesPath, 'default-wallpaper.jpg');
		const myWallpaper = (await Jimp.read(myWallpaperPath)).clone();
		const weatherJimpImg = await Jimp.create(weatherImg);
		const myWallPaperWithWeather = myWallpaper.composite(weatherJimpImg, 100, 100, {
			opacitySource: 0.9,
			mode: Jimp.BLEND_OVERLAY,
			opacityDest: 0.1
		});
		return myWallPaperWithWeather;
	} catch (err) {
		consoleLog('Fail to add weather img to wallpaper.', err);
		throw err;
	}
}

export async function saveWallPaper(image: Jimp) {
	const imgOutputPath = getAssetsPath('images-output');
	await ensurePathExists(imgOutputPath);
	const imageName = findNextFileName(
		imgOutputPath,
		`wallpaper-${formatDate(new Date())}.${image.getExtension()}`
	);
	const imgPath = path.join(imgOutputPath, imageName);
	try {
		await image.writeAsync(imgPath);
		return imgPath;
	} catch (err) {
		consoleLog('Fail to save wallpaper with weather.', err);
		throw err;
	}
}

export function setWallpaper(wallpaperPath: string) {
	return wallpaper.set(wallpaperPath);
}
