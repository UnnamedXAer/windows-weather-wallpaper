import { exec } from 'child_process';
import { openInDefaultApp } from '../processes';
import { mocked } from 'ts-jest/utils';

jest.mock('child_process');

const mockedExec = mocked(exec, true);

test('should open file and return process id', async () => {
	mockedExec.mockReturnValue({ pid: 123, on: (...args: any[]) => {} } as any);

	const processId = await openInDefaultApp('./processes.ts');

	expect(mockedExec).toBeCalled();
	expect(typeof processId).toBe('number');
});
