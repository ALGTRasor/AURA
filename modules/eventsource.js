import { Modules } from "./modules.js";
import { RunningTimeout } from "./utils/running_timeout.js";

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
	constructor(delayed_invoke_delay = 0.333)
	{
		this.subscribers = [];
		this.allow_multiple = false;
		this.dirty = false; // a true value indicates that a delayed invoke has been requested via SetDirty()
		this.invoking = false;
		this.delayedInvoke = new RunningTimeout(() => { this.Invoke(); }, delayed_invoke_delay, false, 50);
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

	SetDirty()
	{
		this.delayedInvoke.ExtendTimer();
	}

	Invoke(data = {}, debugMessage = "")
	{
		if (this.invoking === true && this.allow_multiple !== true) return;
		this.invoking = true;
		this.dirty = false;
		for (var subIndex in this.subscribers) this.subscribers[subIndex].Invoke(data, debugMessage);
		this.invoking = false;
	}

	async InvokeAsync(data = {}, debugMessage = "")
	{
		if (this.invoking === true && this.allow_multiple !== true) return;
		this.invoking = true;
		this.dirty = false;
		for (var subIndex in this.subscribers) await this.subscribers[subIndex].InvokeAsync(data, debugMessage);
		this.invoking = false;
	}
}

Modules.Report('Event Sources', 'This module adds a reusable code component for connecting app functionality via invoked event emitters.');