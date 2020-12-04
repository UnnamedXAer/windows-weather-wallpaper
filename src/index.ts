require('dotenv').config();
import { fetchWeatherData } from './api';
import consoleLog from './utils/consoleLogger';
import { setupSettings } from './settings';
import { createWallpaper, saveWallpaper, setWallpaper } from './wallpaper';
import emitter from './emitter';
import { IMPORTANT_ERROR } from './eventsTypes';

function run() {
	return (async () => {})()
		.then(() => setupSettings())
		.then((settings) => fetchWeatherData(settings.location))
		.then((weatherData) => createWallpaper(weatherData))
		.then((newWallpaper) => saveWallpaper(newWallpaper))
		.then((newWallpaperPath) => setWallpaper(newWallpaperPath))
		.catch((err) => {
			emitter.emit(IMPORTANT_ERROR, 'Wallpaper update failed.', err);
			consoleLog(err);
		})
		.finally(() => {
			consoleLog('all done');
			const timeout = 1000 * 60 * 60 * 1;
			const nextUpdateAt = new Date(Date.now() + timeout);
			consoleLog({ 'Next update at:': nextUpdateAt.toLocaleString() });
			setTimeout(run, timeout);
		});
}

run();
