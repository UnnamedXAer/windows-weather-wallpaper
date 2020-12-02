declare module 'find-next-file-name' {
	/**
	 * Check if given file name is in use, if so return name with appended number to create new unique name.
	 * @param {string} directory
	 * @param {string} fileName
	 * @param {boolean} [continuCounting] if set to true the result for lastmonth (5).pdf will be lastmonth (6).pdf otherwise lastmonth (5) (1).pdf
	 * @returns {string}
	 * 
	 * Example
	 * @code findNextFileName("C:/reports/", "lastmonth.pdf", true);
	 * @code $ lastmonth (1).pdf
	 */
	export default function findNextFileName(
		directory: string,
		fileName: string,
		continuCounting?: boolean
	): string;
}
