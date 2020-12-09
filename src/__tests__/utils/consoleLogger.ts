import { config } from '../../config';
import consoleLog from '../../utils/consoleLogger';

test('should print the text to the console', () => {
	const consoleLogSpy = jest.spyOn(console, 'log');
	consoleLogSpy.mockImplementationOnce(() => {});
	config.console_logs = false;
	consoleLog('TEST');
	expect(consoleLogSpy).not.toBeCalled();
	config.console_logs = true;
	consoleLog('TEST');
	expect(consoleLogSpy).toBeCalled();
});
