import { Modules } from "./modules.js";

export class EventSourceSubscription
{
	constructor(action)
	{
		this.action = action;
	}

	Invoke(data = {}, debugMessage = "")
	{
		if (debugMessage != "") console.log(debugMessage);
		if (this.earlyAction) this.earlyAction(data);
		this.action(data);
		if (this.lateAction) this.lateAction(data);
	}

	async InvokeAsync(data = {}, debugMessage = "")
	{
		if (debugMessage != "") console.log(debugMessage);
		if (this.earlyAction) await this.earlyAction(data);
		await this.action(data);
		if (this.lateAction) await this.lateAction(data);
	}
}

export class EventSource
{
	constructor()
	{
		this.subscribers = [];
	}

	RequestSubscription(action)
	{
		if (!action) return false;
		var subscription = new EventSourceSubscription(action);
		this.subscribers.push(subscription);
		return subscription;
	}

	RemoveSubscription(subscription)
	{
		if (!subscription) return false;
		var spliceIndex = this.subscribers.indexOf(subscription);
		if (spliceIndex < 0) return false;
		this.subscribers.splice(spliceIndex, 1);
		return true;
	}

	Invoke(data = {}, debugMessage = "")
	{
		for (var subIndex in this.subscribers)
		{
			this.subscribers[subIndex].Invoke(data, debugMessage);
		}
	}

	async InvokeAsync(data = {}, debugMessage = "")
	{
		for (var subIndex in this.subscribers)
		{
			await this.subscribers[subIndex].InvokeAsync(data, debugMessage);
		}
	}
}

Modules.Report('Event Sources', 'This module adds a reusable code component for connecting app functionality via invoked event emitters.');
