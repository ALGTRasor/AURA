export class Fax
{
	static all = [];
	static allRead = false;

	static async Read(force = false)
	{
		if (force || !Fax.allRead)
		{
			let resp = await fetch(
				'resources/fax.txt',
				{
					method: 'get',
					headers: { 'accept': 'text/plain' }
				}
			);
			Fax.all = (await resp.text()).split('\n').map(x => x.trim()).filter(x => x != '');
			Fax.allRead = Fax.all.length > 0;
		}
	}

	static async GetOne()
	{
		await Fax.Read();
		return Fax.all[Math.floor(Fax.all.length * Math.random())].trim();
	}
}