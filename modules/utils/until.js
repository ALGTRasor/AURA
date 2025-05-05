export function until(conditionFxn)
{
	const check = resolve =>
	{
		if (conditionFxn()) resolve();
		else setTimeout(_ => check(resolve), 250);
	}
	return new Promise(check);
}