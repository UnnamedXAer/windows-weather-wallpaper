/**
 * @param {Date | number | undefined} date
 * @returns date in format: "YYYY-MM-DD"
 */
export function formatDate(date?: Date | number) {
	const d =
		date instanceof Date
			? date
			: typeof date === 'number'
			? new Date(date)
			: new Date();
	let dayNum = d.getDate();
	let monthNum = d.getMonth() + 1;
	let yearNum = d.getFullYear();
	const day = dayNum < 10 ? '0' + dayNum : '' + dayNum;
	const month = monthNum < 10 ? '0' + monthNum : '' + monthNum;
	return `${yearNum}-${month}-${day}`;
}
