export function Distinct(array = [], remove_empty = true)
{
	const match_first_index = (x, i, a) => a.indexOf(x) === i;
	let result = array.filter(match_first_index);
	if (remove_empty === true) result = result.filter(_ => typeof _ === 'string' && _.length > 0);
	return result;
};



export function SampleArray(array, phase = 0.5)
{
	phase = Math.max(0.0, Math.min(1.0, phase));
	if (array.length > 0)
	{
		let id_phase = phase * (array.length - 1);
		let target_id = Math.round(id_phase);
		return array[target_id];
	}
	return undefined;
}