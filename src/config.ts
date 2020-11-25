import { Config, NODE_ENV } from './types/types';

export const config: Config = {
	NODE_ENV: (process.env.NODE_ENV as NODE_ENV) || 'development',
	isDev: process.env.NODE_ENV !== 'production'
};
