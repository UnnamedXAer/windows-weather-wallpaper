import { createConfig } from '../../config';
import { NODE_ENV } from '../../types/types';

test('should setup the config object', () => {
	const env = process.env.NODE_ENV;

	delete process.env.NODE_ENV;
	let config = createConfig(process);
	expect(config.NODE_ENV).toBe<NODE_ENV>('development');

	process.env.NODE_ENV = 'production';
	config = createConfig(process);
	expect(config.NODE_ENV).toBe<NODE_ENV>('production');

	process.env.NODE_ENV = env;
	config = createConfig(process);
	expect(config.NODE_ENV).toBe<NODE_ENV>('test');
});
