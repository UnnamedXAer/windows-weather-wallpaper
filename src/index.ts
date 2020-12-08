require('dotenv').config();
import { fetchWeatherData } from './api';
import consoleLog from './utils/consoleLogger';
import { setupSettings } from './settings';
import { createWallpaper, saveWallpaper, setWallpaper } from './wallpaper';
import emitter from './emitter';
import { IMPORTANT_ERROR } from './eventsTypes';
import { config } from './config';
import { freeStorageSpace, saveAndOpenLog } from './files';
import { HOUR_IN_MS } from './constants';

let runsCnt = 0;
function run() {
	return (async () => {
		consoleLog('\n\n\t\t\t\t', { 'START, run number': ++runsCnt }, '\n');
		consoleLog('Config:', config);
	})()
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
			consoleLog(err);
		})
		.finally(() => {
			consoleLog('all done');
			if (process.argv.includes('run-once')) {
				return;
			}
			let timeout = 1000 * 15;
			// const timeout = HOUR_IN_MS * 3;
			// @improvement: read timeout from env or args.
			if (config.isDev === false && timeout < HOUR_IN_MS) {
				saveAndOpenLog(
					`
						The run timeout (${timeout} ms) is too short for production build, the timeout must be at least one hour (${HOUR_IN_MS} ms).
						Timeout increased to the default value (3h).
						`,
					new Error('Unacceptable run timeout.')
				);
				timeout = HOUR_IN_MS * 3;
			}
			const nextUpdateAt = new Date(Date.now() + timeout);
			consoleLog({ 'Next update at': nextUpdateAt.toLocaleString() });
			setTimeout(run, timeout);
		});
}

run();
