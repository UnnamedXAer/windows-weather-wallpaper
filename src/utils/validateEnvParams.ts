export const validateEnvParams = () => {
	const env = process.env.NODE_ENV;
	if (env !== 'production' && env !== 'development' && env !== 'test') {
		throw new Error(`Environment. Invalid invalid env = "${env}".`);
	}

	if (typeof process.env.LOCATION_API_URL !== 'string') {
		throw new Error('Environment. Missing location api url.');
	}

	if (typeof process.env.WEATHER_API_URL !== 'string') {
		throw new Error('Environment. Missing weather api url.');
	}
};
