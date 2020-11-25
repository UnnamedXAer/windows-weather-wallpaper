import { config } from '../../config';
import { NODE_ENV } from '../../types/types';
import { getEnvPrefix } from '../../utils/envPrefix';

test('should return prefix base on NODE_ENV', () => {
	// const node_env = config.NODE_ENV;

	// config.NODE_ENV = 'development';
	// expect(getEnvPrefix()).toBe('dev-');

	// config.NODE_ENV = 'production';
	// expect(getEnvPrefix()).toBe('');

	// config.NODE_ENV = 'test';
	expect(getEnvPrefix()).toBe('test-');

	// config.NODE_ENV = '' as NODE_ENV;
	// expect(getEnvPrefix()).toBe('dev-');

	// config.NODE_ENV = node_env;
});
