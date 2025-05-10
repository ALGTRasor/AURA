import { PageManager } from "../../pagemanager.js";
import { SharePoint } from "../../sharepoint.js";
import { FileExplorer } from "../../ui/file_explorer.js";
import { SlideSelector } from "../../ui/slide_selector.js";
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

		instance.e_frame.style.minWidth = '32rem';
		instance.e_content.style.overflow = 'hidden';

		instance.root_selector = new SlideSelector();
		instance.root_selector.CreateElements(
			instance.e_content,
			[
				{ label: 'ACTIVE' },
				{ label: 'ARCHIVE' },
				{ label: 'MY UPLOADS' }
			]
		);

		instance.e_explorer_root = CreatePagePanel(
			instance.e_content, true, false,
			'display:flex;flex-direction:column;flex-wrap:nowrap;'
		);

		instance.explorer = new FileExplorer(instance.e_explorer_root);
		instance.explorer.base_relative_path = 'Clients';
		instance.explorer.autonavigate = false;
		instance.explorer.CreateElements();

		const OnRootChange = () =>
		{
			switch (instance.root_selector.selected_index)
			{
				case 0: instance.explorer.base_relative_path = 'Clients'; break;
				case 1: instance.explorer.base_relative_path = 'ClientsArchive'; break;
				case 2: instance.explorer.base_relative_path = 'ALGUserDocs/Users/' + UserAccountInfo.account_info.user_id; break;
				default: instance.explorer.base_relative_path = 'All Files'; break;
			}
			instance.explorer.Navigate();
		};
		instance.sub_root_changed = instance.root_selector.afterSelectionChanged.RequestSubscription(OnRootChange);
		instance.root_selector.SelectIndexAfterDelay(0, 500, true);
	}



	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let fixed_width = instance.state_data.docked === true && instance.state_data.expanding === false;
		if (fixed_width === true) instance.e_frame.style.maxWidth = '32rem';
		else instance.e_frame.style.maxWidth = '64rem';
	}
}

PageManager.RegisterPage(new PageFiles('files', UserAccountInfo.app_access_permission), 'f', 'File Explorer');