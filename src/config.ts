import { Config, NODE_ENV } from './types/types';
import consoleLog from './utils/consoleLogger';

export const config: Config = {
	NODE_ENV: (process.env.NODE_ENV as NODE_ENV) || 'development',
	isDev: process.env.NODE_ENV !== 'production',
	console_logs: process.env.CONSOLE_LOGS === 'TRUE',
	locationApiUrl: process.env.LOCATION_API_URL as string,
	weatherApiUrl: process.env.WEATHER_API_URL as string,
	defaultWallpaperPath: process.env.DEFAULT_WALLPAPER_PATH as string
};

consoleLog('Config:', config);
