export function Distinct(array = [], remove_empty = true)
{
	const match_first_index = (x, i, a) => a.indexOf(x) === i;
	let result = array.filter(match_first_index);
	if (remove_empty === true) result = result.filter(_ => typeof _ === 'string' && _.length > 0);
	return result;
};