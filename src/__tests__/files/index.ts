import { readImage } from '../../files';

test('should read file', async () => {
	await expect(readImage('test.png')).resolves.toReturn();
	await expect(readImage('test')).rejects.toThrowError(
		`The "test" is not an image file.`
		// new Error()
	);
	await expect(readImage('')).rejects.toThrowError('Empty image name supplied.'
		// new Error()
	);
});
