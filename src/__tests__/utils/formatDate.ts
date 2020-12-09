import { formatDate } from '../../utils/formatDate';

test('should return a date in the YYYY-MM-DD format', () => {
	let date = new Date(2020, 11, 31, 23, 59, 59);
	
	let dateFormatted = formatDate(date);
	expect(dateFormatted).toBe('2020-12-31');

	dateFormatted = formatDate(date.getTime());
	expect(dateFormatted).toBe('2020-12-31');

	date = new Date(2020, 8, 1, 23, 59, 59);
	dateFormatted = formatDate(date);
	expect(dateFormatted).toBe('2020-09-01');

	dateFormatted = formatDate();
	expect(dateFormatted).toMatch(/\d{4}(-\d\d){2}/);
});
