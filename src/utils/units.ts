export const addUnits = (temp: number, units = 'ºC') => {
	const celsius = temp; // - 273.15;
	const unitSymbol = units;
	const round = celsius === 0 ? 0 : celsius < 10 && celsius > -10 ? 1 : 0;
	return `${celsius.toFixed(round)}${unitSymbol}`;
};
