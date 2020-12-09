import { createConfig } from '../../config';

test('should setup the config object', () => {
	const env = process.env.NODE_ENV;
	delete process.env.NODE_ENV;
	let config = createConfig(process);
	expect(config.NODE_ENV).toBe('development');
	process.env.NODE_ENV = env;
	config = createConfig(process);
	expect(config.NODE_ENV).toBe(env);
});
