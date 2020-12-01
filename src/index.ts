require('dotenv').config();
import Jimp from 'jimp';
import wallpaper from 'wallpaper';
import { getAssetsPath, readImage } from './files';
import { formatDate } from './utils/formatDate';
import { fetchCurrentWeather, fetchForecastWeather } from './utils/network';

// readImage('test.png').then(console.log).catch(console.log);

wallpaper.get().then(console.log).catch(console.log);

const dir = getAssetsPath('images', 'test.png');
// (async () => {
// 	try {
// 		const res = await wallpaper.set(dir);
// 		console.log('res', res);
// 	} catch (err) {
// 		console.log('err', err);
// 	}
// })();

// (async () => {
// 	const image = (await Jimp.read(dir)).clone();
// 	const fontPath = getAssetsPath('fonts', 'Retron2000.ttf.fnt');
// 	const font = await Jimp.loadFont(fontPath);

// 	image.print(font, 50, 50, 'Hello John');
// 	await image.writeAsync(
// 		getAssetsPath('images-output', 'test' + formatDate(new Date()) + '.png')
// 	);
// })();
fetchForecastWeather();
