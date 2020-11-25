import { config } from '../config';

export function getEnvPrefix() {
	if (config.NODE_ENV === 'production') {
		return 'prod';
	}
	if (config.NODE_ENV === 'development') {
		return 'dev';
	}
	if (config.NODE_ENV === 'test') {
		return 'test';
	}
	return 'dev';
}
