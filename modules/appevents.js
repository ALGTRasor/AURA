import { EventSource } from "./eventsource.js";

export class AppEvents
{
	static onAccountLogin = new EventSource();
	static onAccountLoginFailed = new EventSource();

	static onToggleLightMode = new EventSource();
	static onToggleLimitWidth = new EventSource();
	static onToggleSpotlight = new EventSource();
	static onToggleHideSensitiveInfo = new EventSource();
	static onToggleDebugLog = new EventSource();

	static onSetAnimSpeed = new EventSource();
	static onSetThemeColor = new EventSource();
}
