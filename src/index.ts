require('dotenv').config({
	path: process.env.NODE_ENV === 'production' ? '.production.env' : '.env'
});
import { fetchWeatherData } from './api';
import consoleLog from './utils/consoleLogger';
import { setupSettings } from './settings';
import { createWallpaper, saveWallpaper, setWallpaper } from './wallpaper';
import emitter from './emitter';
import { IMPORTANT_ERROR } from './eventsTypes';
import { config } from './config';
import { freeStorageSpace, saveAndOpenLog } from './files';
import { validateEnvParams } from './utils/validateEnvParams';

console.warn(
	`The WindowsWeatherWallpaper is started.
	If you are using windows Task Scheduler and see this message try to reconfigure scheduler ().
	`,
	process.pid
);

function run() {
	return (async () => {
		consoleLog('\n\n\t\t\t\t', { START: '🐱‍👤🐱‍👤' }, '\n');
	})()
		.then(() => {
			return validateEnvParams();
		})
		.then(() => consoleLog('Config:', config))
		.then(() => {
			// there is not need to wait for this.
			freeStorageSpace().then(() => consoleLog('Storage cleared.'));
		})
		.then(() => setupSettings())
		.then((settings) => fetchWeatherData(settings.location))
		.then((weatherData) => createWallpaper(weatherData))
		.then((newWallpaper) => saveWallpaper(newWallpaper))
		.then((newWallpaperPath) => setWallpaper(newWallpaperPath))
		.catch((err) => {
			emitter.emit(IMPORTANT_ERROR, 'Wallpaper update failed.', err);
			saveAndOpenLog('The "run" error: ', err);
			consoleLog('The "run" error: ', err);
		})
		.finally(async () => {
			consoleLog('all done');
		});
}

run();
