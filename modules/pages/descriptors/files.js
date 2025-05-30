import { PageManager } from "../../pagemanager.js";
import { FileExplorer } from "../../ui/file_explorer.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { UserAccountInfo } from "../../useraccount.js";
import { CreatePagePanel } from "../../utils/domutils.js";
import { PageDescriptor } from "../pagebase.js";
import { Help } from "./help.js";

export class PageFiles extends PageDescriptor
{
	title = 'files';
	order_index = 4;

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '32rem';
		instance.e_content.style.overflow = 'hidden';
		instance.e_content.style.display = 'flex';
		instance.e_content.style.flexDirection = 'column';
		instance.e_content.style.gap = 'var(--gap-025)';

		instance.root_selector = new SlideSelector();
		instance.root_selector.CreateElements(
			instance.e_content,
			[
				{ label: 'ALL' },
				{ label: 'ACTIVE' },
				{ label: 'ARCHIVE' },
				{ label: 'USER' }
			]
		);

		instance.e_explorer_root = CreatePagePanel(
			instance.e_content, true, false,
			'display:flex; flex-direction:column; flex-wrap:nowrap;'
		);

		instance.explorer = new FileExplorer(instance.e_explorer_root, 'ALGInternal', 'ALGFileLibrary');
		instance.explorer.base_relative_path = 'Clients';
		instance.explorer.autonavigate = false;
		instance.explorer.on_load_start = () => { instance.root_selector.SetDisabled(true); };
		instance.explorer.on_load_stop = () => { instance.root_selector.SetDisabled(false); };
		instance.explorer.CreateElements();

		const OnRootChange = () =>
		{
			if (instance.explorer_mode && instance.explorer_mode > -1 && instance.explorer_mode === instance.root_selector.selected_index) return;
			instance.explorer_mode = instance.root_selector.selected_index;

			switch (instance.explorer_mode)
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
					instance.explorer.base_relative_path = window.DBLayer.config.path_user_files + UserAccountInfo.account_info.user_id;
					instance.explorer.show_folder_actions = true;
					break;
				default:
					instance.explorer.base_relative_path = '';
					instance.explorer.show_folder_actions = false;
					break;
			}
			instance.explorer.ClearSelected();
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
		window.setTimeout(() => { instance.root_selector.ApplySelection(); instance.explorer.RefreshElements(); }, 333);
	}
}

PageManager.RegisterPage(new PageFiles('files', UserAccountInfo.app_access_permission), 'f', 'File Explorer');
Help.Register(
	'pages.files', 'The Files Page',
	'The Files page allows Users to browse the internal file library.'
	+ '\nThe internal file library contains files relevant to projects, users, tasks, HR, contacts, and more.'
	+ '\nEach User is also allocated a reserved directory for their own (work related) usage.'
);