import { DBLayer } from "../../dblayer.js";
import { PageManager } from "../../pagemanager.js";
import { FileExplorer } from "../../ui/file_explorer.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { UserAccountInfo } from "../../useraccount.js";
import { CreatePagePanel } from "../../utils/domutils.js";
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
				{ label: 'ALL' },
				{ label: 'ACTIVE' },
				{ label: 'ARCHIVE' },
				{ label: 'MY UPLOADS' }
			]
		);

		instance.e_explorer_root = CreatePagePanel(
			instance.e_content, true, false,
			'display:flex;flex-direction:column;flex-wrap:nowrap;'
		);

		instance.explorer = new FileExplorer(instance.e_explorer_root, 'ALGInternal', 'ALGFileLibrary');
		instance.explorer.base_relative_path = 'Clients';
		instance.explorer.autonavigate = false;
		instance.explorer.CreateElements();

		const OnRootChange = () =>
		{
			switch (instance.root_selector.selected_index)
			{
				case 1:
					instance.explorer.base_relative_path = 'Clients';
					instance.explorer.show_folder_actions = false;
					break;
				case 2:
					instance.explorer.base_relative_path = 'ClientsArchive';
					instance.explorer.show_folder_actions = false;
					break;
				case 3:
					instance.explorer.base_relative_path = DBLayer.config.path_user_files + UserAccountInfo.account_info.user_id;
					instance.explorer.show_folder_actions = true;
					break;
				default:
					instance.explorer.base_relative_path = '';
					instance.explorer.show_folder_actions = false;
					break;
			}
			instance.explorer.Navigate();
		};
		instance.sub_root_changed = instance.root_selector.afterSelectionChanged.RequestSubscription(OnRootChange);
		instance.root_selector.SelectIndexAfterDelay(0, 250, true);
	}



	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true)
		{
			if (instance.state_data.expanding === true) instance.e_frame.style.maxWidth = '64rem';
			else instance.e_frame.style.maxWidth = '32rem';
		}
		else
		{
			instance.e_frame.style.maxWidth = 'unset';
		}
		window.setTimeout(() => { instance.root_selector.ApplySelection(); }, 333);
	}
}

PageManager.RegisterPage(new PageFiles('files', UserAccountInfo.app_access_permission), 'f', 'File Explorer');