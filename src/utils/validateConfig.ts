import { config } from '../config';

export const validateConfig = () => {
	const env = config.NODE_ENV;
	if (env !== 'production' && env !== 'development' && env !== 'test') {
		throw new Error(`Invalid invalid env = "${env}".`);
	}
};
