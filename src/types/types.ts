export type NODE_ENV = 'production' | 'development' | 'test';
export interface Config {
	NODE_ENV: NODE_ENV;
	isDev: boolean;
}
