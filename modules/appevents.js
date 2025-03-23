import { EventSource } from "./eventsource.js";

export class AppEvents
{
	static onAccountLogin = new EventSource();
	static onAccountLoginFailed = new EventSource();
}
