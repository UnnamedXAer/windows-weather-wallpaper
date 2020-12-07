import { exec } from 'child_process';
import { openInDefaultApp } from '../processes';
import { mocked } from 'ts-jest/utils';

jest.mock('child_process');
// const mockedChildProcess = mocked(childProcess)

const mockedExec = mocked(exec, true);

test('should open file and return process id', async () => {
	mockedExec.mockReturnValue({
		pid: 123,
		on: (...args: any[]) => {
			args[1](2143, 'SIGNAL');
		}
	} as any);

	const subprocess = await openInDefaultApp('./processes.ts');
	// const onSpy = jest
	// 	.spyOn(subprocess, 'on')
	// 	.mockImplementation((...args: any[]): any => {
	// 		args[1](2143, 'SIGNAL');
	// 	});

	expect(mockedExec).toBeCalled();
	expect(typeof subprocess.pid).toBe('number');
	// expect(onSpy).toBeCalled();
});
