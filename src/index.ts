require('dotenv').config();
import { fetchWeatherData } from './api/api';
import consoleLog from './utils/consoleLogger';
import { setupSettings } from './settings';
import { createWallpaper, saveWallPaper, setWallpaper } from './wallpaper/wallpaper';

function run() {
	return setupSettings()
		.then((settings) => fetchWeatherData(settings.location))
		.then((weatherData) => createWallpaper(weatherData))
		.then((newWallpaper) => saveWallPaper(newWallpaper))
		.then((newWallpaperPath) => setWallpaper(newWallpaperPath))
		.catch((err) => {
			consoleLog(err);
		})
		.finally(() => {
			consoleLog('all done');
			setTimeout(run, 1000 * 60 * 60 * 8);
		});
}

run();
