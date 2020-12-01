import Events from 'events';
import consoleLog from '../logger/consoleLogger';
import { NO_LOCATION } from './eventsTypes';

const emitter = new Events.EventEmitter();

emitter.on(NO_LOCATION, (description: string, err: Error) => {
	consoleLog(description, err);
});

export default emitter;
