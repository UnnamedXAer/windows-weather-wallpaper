import { exec } from 'child_process';
import { PathLike } from 'fs';
import consoleLog from './utils/consoleLogger';

export async function openInDefaultApp(filePath: PathLike) {
	try {
		const subprocess = exec('start "" "' + filePath + '"');
		consoleLog('Spawned subprocess #', subprocess.pid, filePath);
		subprocess.on('close', (code, signal) => {
			consoleLog(
				'Subprocess #',
				subprocess.pid,
				'Closed with code:',
				code,
				' and signal: ',
				signal
			);
		});
		return subprocess;
	} catch (err) {
		consoleLog('Fail to open (in default app):', filePath);
		throw err;
	}
}
