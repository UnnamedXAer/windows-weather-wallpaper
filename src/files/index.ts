import fs from 'fs/promises';
import path from 'path';
import { getEnvPrefix } from '../utils/envPrefix';

export async function readImage(imgName: string) {
	if (imgName === '') {
		throw new Error('Empty image name supplied.');
	}
	const ext = path.extname(imgName);
	if (['.png', '.jpg', '.bmp', '.jiff'].includes(ext) === false) {
		throw new Error(`The "${ext}" is not an image file.`);
	}
	const imgPath = path.join(getAssetsPath('images'), imgName);

	try {
		const file = await fs.readFile(imgPath);
		return file;
	} catch (err) {
		throw err;
	}
}

export async function ensurePathExists(dir: string) {
	try {
		await fs.access(dir);
	} catch (err) {
		await fs.mkdir(
			dir
			// { recursive: true }
		);
	}
}

export function getAssetsPath(
	resourceName: 'images' | 'images-output' | 'fonts' | 'data',
	fileName?: string
) {
	if (!resourceName) debugger;
	if (fileName) {
		return path.join(
			__dirname,
			'..',
			'assets',
			getEnvPrefix(),
			resourceName,
			fileName
		);
	}
	return path.join(__dirname, '..', 'assets', getEnvPrefix(), resourceName);
}
