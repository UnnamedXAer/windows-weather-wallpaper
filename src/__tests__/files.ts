import { getStoragePath } from '../files';

test('should return path to storage dir inside src with env prefix', async () => {
	expect(await getStoragePath('settings')).toMatch(/^.\/src\/storage\/settings/);
});
