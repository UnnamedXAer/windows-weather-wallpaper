import { EnvPrefix } from '../../types/types';
import { getEnvPrefix } from '../../utils/envPrefix';

test('should return the environment prefix base on the NODE_ENV value.', () => {
	const nodeEnv = process.env.NODE_ENV;

	expect(getEnvPrefix()).toBe<EnvPrefix>('test');
	process.env.NODE_ENV = 'production';
	expect(getEnvPrefix()).toBe<EnvPrefix>('prod');
	process.env.NODE_ENV = 'development';
	expect(getEnvPrefix()).toBe<EnvPrefix>('dev');
	delete process.env.NODE_ENV;
	expect(getEnvPrefix()).toBe<EnvPrefix>('dev');

	process.env.NODE_ENV = nodeEnv;
});
