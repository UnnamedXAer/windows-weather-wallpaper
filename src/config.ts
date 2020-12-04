import { Config, NODE_ENV } from './types/types';
import consoleLog from './utils/consoleLogger';
import { getEnvPrefix } from './utils/envPrefix';

export const config: Config = {
	NODE_ENV: (process.env.NODE_ENV as NODE_ENV) || 'development',
	isDev: process.env.NODE_ENV !== 'production',
	envPrefix: getEnvPrefix(),
	console_logs: process.env.CONSOLE_LOGS === 'TRUE',
	locationApiUrl: process.env.LOCATION_API_URL as string,
	weatherApiUrl: process.env.WEATHER_API_URL as string,
	defaultWallpaperPath: process.env.DEFAULT_WALLPAPER_PATH as string,
	trackLocationChanges: process.env.TRACK_LOCATION_CHANGES === 'TRUE'
};

consoleLog('Config:', config);
