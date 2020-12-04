import { PathLike, MakeDirectoryOptions } from 'fs';
import fsPromises from 'fs/promises';

const copyFile: typeof fsPromises.copyFile = (src, dest, flags) => {
	console.log('mocked: fs.promises.copyFile');
	return Promise.resolve();
};

const mkdir = (path: PathLike, options?: MakeDirectoryOptions & { recursive: true }) => {
	return Promise.resolve(path.toString());
};

const fs = jest.mock('fs/promises', () => ({
	copyFile: copyFile,
	mkdir: mkdir
}));

export default fs;
