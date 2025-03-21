export function until(conditionFxn)
{
	const poll = resolve =>
	{
		if (conditionFxn()) resolve();
		else setTimeout(_ => poll(resolve), 250);
	}
	return new Promise(poll);
}