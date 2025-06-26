import { DBLayer } from "../../remotedata/dblayer.js";
import { get_guid } from "../../utils/mathutils.js";

export class UserAllocationData
{
	guid = '';
	user_id = '';
	allocation_max = 0;
	use_history = [];

	static Nothing = new UserAllocationData();
	static Default = new UserAllocationData(
		{
			guid: get_guid(),
			user_id: '',
			allocation_max: 8,
			use_history: []
		}
	);

	constructor(data)
	{
		for (let prop_key in data) this[prop_key] = data[prop_key];
	}

	GetCompact()
	{
		return {
			Title: this.guid,
			user_id: this.user_id,
			allocation_max: this.allocation_max,
			use_history: JSON.stringify(this.use_history)
		};
	}
}



export class UserAllocations
{
	static async CreateNew(allocation_data = UserAllocationData.Nothing)
	{
		return await DBLayer.CreateRecord(
			window.SharedData['user allocations'].instance.descriptor,
			{ fields: allocation_data.GetCompact() }
		);
	}

	static async DeleteExisting(allocation_id = '')
	{
		if (typeof allocation_id !== 'string' || allocation_id.length < 1) 
		{
			console.warn('Failed to delete allocation : allocation_id invalid');
			return;
		}

		return await DBLayer.DeleteRecord(window.SharedData['user allocations'].instance.descriptor, allocation_id);
	}
}