import { DebugLog } from "../debuglog.js";

export class Needer
{
	constructor(needed)
	{
		this.needed = needed;
	}
}

export class Needed
{
	needers = [];
	any_needers = false;
	name = 'Needed Thing';
	log_changes = false;

	// actions for direct instances
	after_became_needed = () => { };
	after_became_not_needed = () => { };

	AddNeeder()
	{
		let new_needer = new Needer(this);
		this.needers.push(new_needer);
		this.BecomeNeeded();
		return new_needer;
	}

	RemoveNeeder(needer)
	{
		let existing_index = this.needers.indexOf(needer);
		if (existing_index < 0) return undefined;
		if (this.needers.length <= 1) this.BecomeNotNeeded();
		return this.needers.splice(existing_index, 1);
	}

	BecomeNeeded()
	{
		if (this.any_needers === true) return;
		this.any_needers = true;
		this.OnBecameNeeded();
		this.after_became_needed();
		if (this.log_changes === true) DebugLog.Log('Became Needed: ' + this.name);
	}

	BecomeNotNeeded()
	{
		if (this.any_needers === false) return;
		this.any_needers = false;
		this.OnBecameNotNeeded();
		this.after_became_not_needed();
		if (this.log_changes === true) DebugLog.Log('No Longer Needed: ' + this.name);
	}

	// overrides for extended class instances
	OnBecameNeeded() { }
	OnBecameNotNeeded() { }
}