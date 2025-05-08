import { DBConfig } from "../../dbconfig.js";
import { DebugLog } from "../../debuglog.js";
import { PageManager } from "../../pagemanager.js";
import { SharePoint } from "../../sharepoint.js";
import { UserAccountInfo } from "../../useraccount.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { PageDescriptor } from "../pagebase.js";

export class PageFiles extends PageDescriptor
{
	title = 'files';

	static root_library_name = 'ALGFileLibrary';

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '30rem';

		instance.path_current = '';
		instance.loading_items = false;

		instance.load_blocker = addElement(
			instance.e_content, 'div', null,
			'position:absolute;inset:0;z-index:100;user-select:none;cursor:wait;'
			+ 'transition-property:opacity; transition-duration:var(--trans-dur-on-slow); transition-timing-function:ease-in-out;'
			+ 'backdrop-filter:blur(1px) brightness(80%);'
		);

		instance.path_dirty = new RunningTimeout(() => { this.Navigate(instance, ''); }, 0.5, false, 150);
		instance.e_path_root = CreatePagePanel(
			instance.e_content, true, false,
			'flex-grow:0.0; flex-shrink:0.0; font-size:0.7rem;'
			+ 'direction:rtl; padding-right:calc(var(--gap-1) + 2px); padding-left:calc(var(--gap-1) + 2px);'
			+ 'align-content:center; text-align:left; text-overflow:ellipsis; text-wrap:nowrap; word-wrap:anywhere;',
			_ => _.innerHTML = 'root'
		);
		/*
		instance.e_input_path = addElement(
			instance.e_path_root, 'input', null,
			'position:absolute; inset:0; padding:var(--gap-1); color:hsl(from var(--theme-color) h s 45%);',
			_ =>
			{
				_.type = 'text';
				_.placeholder = 'Enter folder path...';
				_.addEventListener('keyup', e =>
				{
					e.stopPropagation(); e.preventDefault();
					instance.path_dirty.ExtendTimer();
				});
			}
		);
		*/

		instance.e_items_root = CreatePagePanel(instance.e_content, true, false, null, _ => { _.classList.add('scroll-y'); });

		window.setTimeout(() => { this.Navigate(instance, ''); }, 250);
	}

	OnStartLoading(instance)
	{
		instance.loading_items = true;
		instance.load_blocker.style.opacity = '100%';
		instance.load_blocker.style.pointerEvents = 'all';
	}

	OnStopLoading(instance)
	{
		instance.loading_items = false;
		instance.load_blocker.style.opacity = '0%';
		instance.load_blocker.style.pointerEvents = 'none';
	}

	DownloadFile(instance, file_url = '')
	{
		if ('e_file_view' in instance && 'remove' in instance.e_file_view) instance.e_file_view.remove();
		instance.e_file_view = CreatePagePanel(
			instance.e_content, true, false, 'all:unset; display:block; position:absolute; pointer-events:none; width:0; height:0;',
			_ => { _.innerHTML = `<embed src="${file_url}" width="500" height="375" type="application/pdf">`; }
		);
	}

	Navigate(instance, relative_path)
	{
		let path_html = PageFiles.root_library_name + '/' + relative_path;

		const highlight_prefix = `<span style='color:hsl(from var(--theme-color) h s 70%); font-weight:bold; font-size:0.8rem; padding:var(--gap-025); background:hsl(from var(--theme-color) h s 30%); border-radius:var(--gap-05);'>`;
		const highlight_suffix = `</span>`;
		const highlight_last = (_, id, all) =>
		{
			if (id >= (all.length - 1)) return `${highlight_prefix}${_}${highlight_suffix}`;
			return _;
		};
		path_html = path_html.split('/').filter(_ => _.length > 0).map(highlight_last).join('/');
		instance.e_path_root.innerHTML = path_html;
		instance.e_path_root.title = (PageFiles.root_library_name + '/' + relative_path).split('/').filter(_ => _.length > 0).join(' / ');

		const rgx_get_rel_path = /(https?:\/\/[\w\.]+\.com)\/sites\/([^\/]+)\/([^\/]+)\/(.+)/;

		const prep_site_element = (_, site) =>
		{
			_.innerHTML = `${site.displayName} [${site.name}] <br>${site.webUrl}`;
			_.title = site.description;
		};

		const prep_drive_element = (_, drive) =>
		{
			_.innerHTML = `[${drive.driveType}] ${drive.name}<br>${drive.webUrl}`;
			_.title = drive.description;
		};

		const prep_driveitem_element = (_, driveitem) =>
		{
			_.innerHTML = driveitem.name;
			_.title = "Open Folder:\n" + driveitem.name;

			driveitem.type = 'unknown';
			if ('file' in driveitem) 
			{
				const file_button_style = 'display:block; position:absolute;'
					+ 'top:50%; right:var(--gap-1); transform:translate(0%,-50%); transform-origin:50% 0%;'
					+ 'aspect-ratio:1.0; height:min(1rem, 100%); width:auto;'
					+ 'border:solid 2px hsl(from var(--theme-color) h s 50%);'
					+ 'background:hsl(from var(--theme-color) h s 30%); cursor:pointer;'
					+ 'border-radius:var(--gap-05);';

				driveitem.type = 'file';
				_.style.paddingRight = '4rem';

				addElement(
					_, 'div', 'hover-lift',
					file_button_style,
					e_btn_dl =>
					{
						e_btn_dl.addEventListener(
							'click',
							e =>
							{
								if (instance.loading_items === true) return;
								this.DownloadFile(instance, driveitem['@microsoft.graph.downloadUrl']);
							}
						);
						e_btn_dl.title = 'Download File:\n' + driveitem.name;
						addElement(
							e_btn_dl, 'i', 'material-symbols', 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); line-height:0.9rem; font-size:0.9rem;',
							e_icon_dl => { e_icon_dl.innerText = 'download'; }
						);
					}
				);

				const viewable_extensions = ['xlsx', 'pdf', 'docx', 'doc', 'csv'];
				const can_view = file_name => viewable_extensions.indexOf(file_name.split('.').at(-1)) > -1;
				if (can_view(driveitem.name) === true)
				{
					addElement(
						_, 'div', 'hover-lift',
						file_button_style + 'right:calc(1.5rem + var(--gap-1));',
						e_btn_view =>
						{
							e_btn_view.addEventListener('click', e => { window.open(driveitem.webUrl, '_blank'); });
							e_btn_view.title = 'View File Online:\n' + driveitem.name;
							addElement(
								e_btn_view, 'i', 'material-symbols', 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); line-height:0.9rem; font-size:0.9rem;',
								e_icon_dl => { e_icon_dl.innerText = 'open_in_new'; }
							);
						}
					);
				}
			}
			else if ('folder' in driveitem)
			{
				driveitem.type = 'folder';
				_.style.setProperty('--theme-color', '#fb0');
				_.style.cursor = 'pointer';
				_.style.paddingLeft = '1rem';
				_.innerHTML = ' / ' + driveitem.name;

				_.addEventListener(
					'click',
					_ =>
					{
						if (instance.loading_items === true) return;
						let rgxmatch = decodeURIComponent(driveitem.webUrl).match(rgx_get_rel_path);
						if (rgxmatch) this.Navigate(instance, rgxmatch[4]);
						else this.Navigate(instance, driveitem.webUrl);
					}
				);
			}
			if ('createdBy' in driveitem && 'user' in driveitem.createdBy) _.title += `\nCreated by ${driveitem.createdBy.user.displayName} (${driveitem.createdBy.user.email})`;
			if ('lastModifiedBy' in driveitem && 'user' in driveitem.lastModifiedBy) _.title += `\nModified by ${driveitem.lastModifiedBy.user.displayName} (${driveitem.lastModifiedBy.user.email})`;
		};

		instance.e_items_root.innerHTML = '';
		this.OnStartLoading(instance);

		PageFiles.FetchFolderItems('ALG Internal', relative_path).then(
			items => 
			{


				if (items)
				{
					if (typeof relative_path === 'string' && relative_path.length > 0)
					{
						CreatePagePanel(
							instance.e_items_root, false, false,
							'font-size:0.7rem;',
							_ =>
							{
								let parent_path_parts = relative_path.split('/');
								parent_path_parts.splice(parent_path_parts.length - 1, 1);
								const parent_path = parent_path_parts.join('/');
								prep_driveitem_element(_, { folder: {}, webUrl: parent_path, name: '← back to ' + PageFiles.root_library_name + '/' + parent_path });
							}
						);
					}

					for (let id in items)
					{
						CreatePagePanel(
							instance.e_items_root, false, false,
							'font-size:0.7rem;',
							_ => prep_driveitem_element(_, items[id])
						);
					}
					this.OnStopLoading(instance);
				}
				else
				{
					instance.e_items_root.innerHTML = 'FAILED TO GET PATH ITEMS!';
					this.OnStopLoading(instance);
				}
			}
		);
	}

	static site_id = '';
	static drive_id = '';

	static async ValidateDriveId(site_name = '')
	{
		let drive_id_invalid = typeof PageFiles.drive_id !== 'string' || PageFiles.drive_id.length < 1;
		let site_id_invalid = typeof PageFiles.site_id !== 'string' || PageFiles.site_id.length < 1;
		if (drive_id_invalid || site_id_invalid)
		{
			if (site_id_invalid)
			{
				if (typeof site_name !== 'string' || site_name.length < 1) return;
				PageFiles.site_id = (await SharePoint.GetData(SharePoint.url_api + `/sites?search=${site_name}`)).value[0].id;
			}

			let drives = (await SharePoint.GetData(SharePoint.url_api + `/sites/${PageFiles.site_id}/drives`)).value;
			PageFiles.drive_id = drives.filter(_ => _.name === 'ALGFileLibrary')[0].id;
		}
	}

	static async FetchRootFolderId(site_name = '')
	{
		await PageFiles.ValidateDriveId(site_name);
		return (await SharePoint.GetData(SharePoint.url_api + `/drives/${PageFiles.drive_id}/root/children`)).value;
	}

	static async FetchFolderItems(site_name = '', relative_path = '')
	{
		if (typeof relative_path === 'string' && relative_path.length > 0)
		{
			relative_path = encodeURIComponent(relative_path);
			await PageFiles.ValidateDriveId(site_name);
			return (await SharePoint.GetData(SharePoint.url_api + `/drives/${PageFiles.drive_id}/root:/${relative_path}:/children?select=id,name,file,folder,createdBy,lastModifiedBy,webUrl,@microsoft.graph.downloadUrl`)).value;
		}
		else 
		{
			await PageFiles.ValidateDriveId(site_name);
			return (await SharePoint.GetData(SharePoint.url_api + `/drives/${PageFiles.drive_id}/root/children`)).value;
		}
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let fixed_width = instance.state_data.docked === true && instance.state_data.expanding === false;
		if (fixed_width === true) instance.e_frame.style.maxWidth = '30rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}
}

PageManager.RegisterPage(new PageFiles('files', UserAccountInfo.app_access_permission), 'f', 'File Explorer');