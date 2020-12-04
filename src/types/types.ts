export type NODE_ENV = 'production' | 'development' | 'test';
export interface Config {
	NODE_ENV: NODE_ENV;
	isDev: boolean;
	envPrefix: 'test' | 'dev' | 'prod';
	console_logs: boolean;
	locationApiUrl: string;
	weatherApiUrl: string;
	defaultWallpaperPath: string;
	trackLocationChanges: boolean;
}

export interface Geolocation {
	city: string;
	country: string;
	geonameId: number;
	lat: number;
	lng: number;
	postalCode: string;
	region: string;
	timezone: string;
}

export interface Temperature {
	main: number;
	feelsLike: number;
	min: number;
	max: number;
}

export interface Wind {
	speed: number;
	deg: number;
}

export interface WeatherLocation {
	id: number;
	city: string;
	latitude: number;
	longitude: number;
}

export interface WeatherData {
	imgName: string;
	temperature: Temperature;
	pressure: number;
	humidity: number;
	wind: Wind;
	time: number;
	clouds: number;
	description: string;
	shortDescription: string;
}

export interface CurrentWeather {
	weatherData: WeatherData & {
		// imgName: string;
		// temperature: Temperature;
		// pressure: number;
		// humidity: number;
		// wind: Wind;
		// time: number;
		// clouds: number;
		// description: string;
		// shortDescription: string;
		dt: number;
		sunrise: number;
		sunset: number;
		visibility: number;
	};
	location: WeatherLocation;
}

export interface ForecastWeather {
	location: WeatherLocation;
	linesCnt: number;
	sun: {
		sunrise: number;
		sunset: number;
	};
	weatherData: WeatherData[];
}

export interface Settings {
	dt: string | null;
	defaultWallpaperPath: string | null;
	wallpaperCopyPath: string | null;
	wallpaperSize: {
		width: number;
		height: number;
	} | null;
	location: Geolocation | null;
}
