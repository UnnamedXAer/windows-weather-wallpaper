export type NODE_ENV = 'production' | 'development' | 'test';
export interface Config {
	NODE_ENV: NODE_ENV;
	isDev: boolean;
	console_logs: boolean;
	locationApiUrl: string;
	weatherApiUrl: string;
	defaultWallpaperPath: string;
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
	dt: string;
	defaultWallpaperPath?: string;
	wallpaperCopyPath?: string;
	location: Geolocation | null;
}
