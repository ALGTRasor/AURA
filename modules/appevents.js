import { EventSource } from "./eventsource.js";

export class AppEvents
{
	static windowSizeChanged = new EventSource();

	static pageLayoutChanged = new EventSource();

	static onAccountLogin = new EventSource();
	static onAccountLoginFailed = new EventSource();

	static onSaveSettings = new EventSource();

	static onDebugModeActivated = new EventSource();
	static onDebugModeDeactivated = new EventSource();
}
