import { DebugLog } from "../../debuglog.js";
import { PageManager } from "../../pagemanager.js";
import { UserAccountInfo } from "../../useraccount.js";
import { PageDescriptor } from "../pagebase.js";

export class PageFiles extends PageDescriptor
{
	title = 'files';

	OnCreateElements(instance)
	{
		if (!instance) return;
		instance.e_frame.style.minWidth = '20rem';
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let fixed_width = instance.state_data.docked === true && instance.state_data.expanding === false;
		if (fixed_width === true) instance.e_frame.style.maxWidth = '20rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}
}

PageManager.RegisterPage(new PageFiles('files', UserAccountInfo.app_access_permission));