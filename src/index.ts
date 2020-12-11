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
import { validateEnvParams } from './utils/validateEnvParams';
// import { accessSync } from 'fs';
// import { readFileSync } from 'fs';
const windowsApiWindow = require('windows-api-show-window');

// console.log('__dirname', __dirname);
// if (true || __dirname.includes('\\snapshot\\')) {
// 	try {
// 		const fileText = readFileSync('../.production.env');
// 		console.log('env accessible', '\nParsing env content...');
// 		console.log('\n\n ' + fileText + '\n\n');

// 		const envVars = fileText
// 			.toString()
// 			.split('\n')
// 			.map((line) => {
// 				const keyValue = line.replace('/r', '').trim().split('=');
// 				return keyValue;
// 			});

// 		envVars.forEach((envVar) => {
// 			const name = envVar[0];
// 			console.log('check var: ' + name);
// 			if (
// 				envVar.length < 2 ||
// 				name === undefined ||
// 				envVar[0].startsWith('#') ||
// 				typeof process.env[name] === 'string'
// 			) {
// 				console.log('var: ' + name + ' skipped');

// 				return;
// 			}
// 			console.log('setting ' + name + '=' + envVar[1]);
// 			process.env[name] = envVar[1];
// 		});
// 		console.log('The env parsed.');
// 	} catch (err) {
// 		console.log('missing env', err);
// 	}
// }

// console.log(process.env);
// console.warn(
// 	'The WindowsWeatherWallpaper is started. This window will hide in a few seconds, but the program will work in background'
// );
run();
// setTimeout(() => {
// 	console.log('hiding...');
// 	windowsApiWindow
// 		.hideCurrentProcessWindow()
// 		.then(() => {
// 			console.log('You should not be able to see this!');
// 		})
// 		.catch((err: any) => {
// 			console.error('Unable to hide window', err);
// 			saveAndOpenLog('Unable to hide window', err);
// 		});
// }, 1000 * 60);

let runsCnt = 0;
// @improvement: read timeout from env or args.
// let timeout = 1000 * 60;
let timeout = HOUR_IN_MS * 3;

function run() {
	return (async () => {
		console.log('\n\n\t\t\t\t', { 'START, run number': ++runsCnt }, '\n');
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
			consoleLog(err);
		})
		.finally(() => {
			consoleLog('all done');
			if (process.argv.includes('run-once')) {
				return;
			}

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
