import { config } from '../config';

let consoleLogTime = Date.now();

const consoleLog = (...args: any[]) => {
	if (config.console_logs === false) {
		return;
	}

	const now = Date.now();
	var _args = Array.prototype.slice.call(args);
	_args.unshift(`(${now - consoleLogTime} ms) ->`);
	_args.unshift(new Date().toLocaleTimeString());
	_args.unshift('WinWallWeather: ');
	console.log.apply(null, _args);
	consoleLogTime = now;
};

export default consoleLog;
