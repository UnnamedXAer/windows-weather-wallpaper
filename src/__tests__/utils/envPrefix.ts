import { getEnvPrefix } from '../../utils/envPrefix';

test('should return prefix base on NODE_ENV', () => {
	expect(getEnvPrefix()).toBe('test');
});
