import Jimp from 'jimp';

export async function getJimpImg() {
	return await Jimp.read('../storage/test-data/def-wallpaper.jpg');
}
