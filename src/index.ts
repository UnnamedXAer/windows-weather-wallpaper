import wallpaper from 'wallpaper';
import { getAssetsPath, readImage } from './files';

readImage('test.png').then(console.log).catch(console.log);

wallpaper.get().then(console.log).catch(console.log);

const dir = getAssetsPath('images', 'test.png');
(async () => {
	try {
		const res = await wallpaper.set(dir);
		console.log('res', res);
	} catch (err) {
		console.log('err', err);
	}
})();
