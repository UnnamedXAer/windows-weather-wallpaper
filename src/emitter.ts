import Events from 'events';
import { saveAndOpenLog } from './files';
import consoleLog from './utils/consoleLogger';
import { IMPORTANT_ERROR, NO_LOCATION } from './eventsTypes';

const emitter = new Events.EventEmitter();

emitter.on(NO_LOCATION, (description: string, err: Error) => {
	consoleLog(description, err);
});

emitter.on(IMPORTANT_ERROR, async (description: string, err: Error) => {
	try {
		await saveAndOpenLog(description, err);
	} catch (err) {}
	setTimeout(() => {
		process.exit(1);
	}, 1000);
});

export default emitter;
