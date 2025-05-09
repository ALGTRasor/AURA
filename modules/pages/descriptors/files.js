import { PageManager } from "../../pagemanager.js";
import { SharePoint } from "../../sharepoint.js";
import { FileExplorer } from "../../ui/file_explorer.js";
import { UserAccountInfo } from "../../useraccount.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { PageDescriptor } from "../pagebase.js";

export class PageFiles extends PageDescriptor
{
	title = 'files';

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '36rem';
		instance.e_content.style.overflow = 'hidden';
		instance.e_explorer_root = CreatePagePanel(
			instance.e_content, true, false,
			'display:flex;flex-direction:column;flex-wrap:nowrap;'
		);

		instance.explorer = new FileExplorer(instance.e_explorer_root);
		instance.explorer.base_relative_path = 'Clients';
		instance.explorer.CreateElements();
	}



	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let fixed_width = instance.state_data.docked === true && instance.state_data.expanding === false;
		if (fixed_width === true) instance.e_frame.style.maxWidth = '36rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}
}

PageManager.RegisterPage(new PageFiles('files', UserAccountInfo.app_access_permission), 'f', 'File Explorer');