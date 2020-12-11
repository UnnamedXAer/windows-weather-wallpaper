import { Config, NODE_ENV } from './types/types';
import { getEnvPrefix } from './utils/envPrefix';
import path from 'path';
import os from 'os';
const { name } = require('../package.json');

export const createConfig = (process: NodeJS.Process): Config => {
	return {
		NODE_ENV: (process.env.NODE_ENV as NODE_ENV) || 'development',
		isDev: process.env.NODE_ENV !== 'production',
		envPrefix: getEnvPrefix(),
		console_logs: process.env.CONSOLE_LOGS === 'TRUE',
		locationApiUrl: process.env.LOCATION_API_URL as string,
		weatherApiUrl: process.env.WEATHER_API_URL as string,
		defaultWallpaperPath: process.env.DEFAULT_WALLPAPER_PATH || null,
		trackLocationChanges: process.env.TRACK_LOCATION_CHANGES === 'TRUE',
		appTemporaryDataFolder: path.join(
			process.env.LOCALAPPDATA
				? process.env.LOCALAPPDATA
				: path.join(os.homedir(), 'AppData', 'Local'),
			name
		)
	};
};

export const config = createConfig(process);
