import { addUnits } from '../../utils/units';

test('should return the value with units', () => {
	let output = addUnits(123);
	expect(output).toBe('123ºC');

	output = addUnits(123.12);
	expect(output).toBe('123ºC');

	output = addUnits(1.12);
	expect(output).toBe('1.1ºC');

	output = addUnits(10.1);
	expect(output).toBe('10ºC');

	output = addUnits(-1.12);
	expect(output).toBe('-1.1ºC');

	output = addUnits(-123.12);
	expect(output).toBe('-123ºC');

	output = addUnits(0);
	expect(output).toBe('0ºC');

	output = addUnits(-0, 'K');
	expect(output).toBe('0K');
});
