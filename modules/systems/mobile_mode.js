export class MobileMode
{
	static enabled = false;

	static Check()
	{
		MobileMode.enabled = window.visualViewport.width < window.visualViewport.height;
		window.mobile_mode_enabled = MobileMode.enabled === true;
	}
}