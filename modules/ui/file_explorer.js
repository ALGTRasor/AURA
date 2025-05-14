import { addElement, CreatePagePanel, setSiblingIndex } from "../utils/domutils.js";
import { PanelContent } from "./panel_content.js";
import { Modules } from "../modules.js";
import { SharePoint } from "../sharepoint.js";
import { FileTypes } from "../utils/filetypes.js";
import { OverlayManager } from "./overlays.js";
import { NotificationLog } from "../notificationlog.js";

class FileExplorerItem
{
    constructor(explorer = {}, item_info = {})
    {
        this.explorer = explorer;
        this.item_info = item_info;
        this.item_type = 'unknown';
        this.tooltips = [];

        this.DetermineFileType();
        this.tooltips.push(this.item_type.toUpperCase());
        this.tooltips.push(this.item_info.name);
        this.AddTimestampTooltip('createdBy', 'createdDateTime', 'Created');
        this.AddTimestampTooltip('lastModifiedBy', 'lastModifiedDateTime', 'Modified');
    }

    DetermineFileType()
    {
        if ('bundle' in this.item_info) this.item_type = 'bundle'; // collection of items, such as a zip or a shared grouping of files
        if ('folder' in this.item_info) this.item_type = 'folder';
        if ('file' in this.item_info) this.item_type = 'file';
    }

    AddTimestampTooltip(user_property = 'by', date_property = 'dateTime', verb = 'Changed')
    {
        let hasUser = user_property in this.item_info;
        let hasDate = date_property in this.item_info;
        let valUser = this.item_info[user_property];
        let valDate = this.item_info[date_property];

        if (hasUser && hasDate)
        {
            this.tooltips.push(`${verb} by ${valUser.user.displayName} @ ${new Date(valDate).toLocaleString()}`);
        }
        else if (hasUser && !hasDate)
        {
            this.tooltips.push(`${verb} by ${valUser.user.displayName}`);
        }
        else if (!hasUser && hasDate)
        {
            this.tooltips.push(`${verb} @ ${new Date(valDate).toLocaleString()}`);
        }
    }

    CreateElements(e_parent)
    {
        this.e_parent = e_parent;

        this.e_root = CreatePagePanel(
            this.e_parent, false, false, null,
            _ =>
            {
                _.classList.add('file-explorer-item');
                _.title = this.tooltips.join('\n');
                _.tabIndex = '0';

                addElement(_, 'span', 'file-explorer-item-title', null, _ => { _.innerText = this.item_info.name; });
            }
        );

        switch (this.item_type)
        {
            case 'file': this.CreateFileElements(); break;
            case 'folder': this.CreateFolderElements(); break;
            case 'bundle': this.CreateFolderElements(); break;
        }

        this.e_root.title = this.tooltips.join('\n');
    }

    RemoveElements()
    {
        this.e_root.remove();
    }


    CreateItemButtons(buttons = [])
    {
        if (!buttons || buttons.length < 1) return;

        this.e_btn_root = CreatePagePanel(this.e_root, true, false, null, _ => _.classList.add('file-explorer-item-buttons-root'));
        this.e_btn_root.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); });
        for (let bid in buttons)
        {
            let button = buttons[bid];
            addElement(
                this.e_btn_root, 'div', 'file-explorer-item-button', null,
                e_btn =>
                {
                    e_btn.addEventListener(
                        'click',
                        button.click_action
                    );
                    e_btn.title = button.label;
                    addElement(
                        e_btn, 'i', 'material-symbols', null,
                        e_icon => { e_icon.innerText = button.icon ?? 'help'; }
                    );
                }
            );
        }
    }

    CreateFileElements()
    {
        this.e_root.classList.add('file-explorer-file');

        let item_type_info = FileTypes.GetInfo(this.item_info.name);
        this.e_root.title = this.item_info.name;

        addElement(
            this.e_root, 'div', 'file-explorer-item-info', null,
            _ =>
            {
                addElement(
                    _, 'span', null, 'padding:var(--gap-05); border-radius:var(--gap-05);',
                    _ =>
                    {
                        if (item_type_info)
                        {
                            _.innerText = item_type_info.label;
                            _.title = item_type_info.description;
                            _.style.backgroundColor = 'hsl(from ' + item_type_info.color + ' h 50% 25%)';
                            _.style.borderColor = 'hsl(from ' + item_type_info.color + ' h 50% 35%)';
                        }
                        else
                            _.innerText = 'file';
                    }
                );
            }
        );

        let buttons = [];

        buttons.push(
            {
                label: 'Download File',
                icon: 'download',
                click_action: e =>
                {
                    if (this.loading_items === true) return;
                    this.explorer.DownloadFile(this.item_info['@microsoft.graph.downloadUrl']);
                }
            }
        );

        if (item_type_info && item_type_info.viewable === true)
        {
            buttons.push(
                {
                    label: 'View File Online',
                    icon: 'open_in_new',
                    click_action: e => window.open(this.item_info.webUrl, '_blank')
                }
            );
        }

        buttons.push(
            {
                label: 'More Options',
                icon: 'more_horiz',
                click_action: e =>
                {
                    OverlayManager.ShowChoiceDialog(
                        'File Options: ((' + this.item_info.name + '))',
                        [
                            {
                                label: 'Rename File',
                                color: '#0af',
                                on_click: overlay =>
                                {
                                    OverlayManager.ShowStringDialog(
                                        'Rename File',
                                        this.item_info.name,
                                        new_name => { },
                                        () => { NotificationLog.Log('Cancelled File Rename', '#fa0'); }
                                    );
                                    overlay.Remove();
                                }
                            },
                            {
                                label: 'Duplicate File',
                                color: '#0ff',
                                on_click: overlay => { overlay.Remove(); }
                            },
                            {
                                label: 'Copy File Name',
                                color: '#0df',
                                on_click: overlay =>
                                {
                                    NotificationLog.Log('Copied File Name', '#8ff');
                                    navigator.clipboard.writeText(this.item_info.name);
                                    overlay.Remove();
                                }
                            },
                            {
                                label: 'Copy File Path',
                                color: '#0df',
                                on_click: overlay =>
                                {
                                    NotificationLog.Log('Copied File Path', '#8ff');
                                    navigator.clipboard.writeText('/' + this.explorer.relative_path_current + '/' + this.item_info.name);
                                    overlay.Remove();
                                }
                            },
                            {
                                label: 'Delete File',
                                color: '#f40',
                                on_click: overlay =>
                                {
                                    OverlayManager.ShowConfirmDialog(
                                        _ => { },
                                        _ => { NotificationLog.Log('Cancelled file deletion', '#fa0') },
                                        'Are you sure you want to delete the file: ((' + this.item_info.name + '))?',
                                        'YES',
                                        'NO'
                                    );
                                    overlay.Remove();
                                }
                            }
                        ]
                    )
                }
            }
        );

        this.CreateItemButtons(buttons);
    }

    CreateFolderElements()
    {
        this.e_root.classList.add('file-explorer-folder');
        this.e_root.title = "Open Folder:\n" + this.item_info.name;

        if ('childCount' in this.item_info.folder) 
        {
            if (this.item_info.folder.childCount > 0)
                addElement(this.e_root, 'span', 'file-explorer-item-info', null, _ => { _.innerText = this.item_info.folder.childCount + ' items' });
            else
                addElement(this.e_root, 'span', 'file-explorer-item-info', null, _ => { _.innerText = 'empty'; _.style.color = '#fa0'; });
        }
        else _.style.setProperty('--theme-color', '#fa47');

        this.e_root.addEventListener(
            'click',
            _ =>
            {
                if (this.loading_items === true) return;
                const rgx_get_rel_path = /(https?:\/\/[\w\.]+\.com)\/sites\/([^\/]+)\/([^\/]+)\/(.+)/;
                let rgxmatch = decodeURIComponent(this.item_info.webUrl).match(rgx_get_rel_path);
                if (rgxmatch) this.explorer.Navigate(rgxmatch[4]);
                else this.explorer.Navigate(this.item_info.webUrl);
            }
        );

        let buttons = [];
        buttons.push(
            {
                label: 'More Options',
                icon: 'more_horiz',
                click_action: e =>
                {
                    OverlayManager.ShowChoiceDialog(
                        'Folder Options: ((' + this.item_info.name + '))',
                        [
                            {
                                label: 'Rename Folder',
                                color: '#0af',
                                on_click: overlay =>
                                {
                                    OverlayManager.ShowStringDialog(
                                        'Rename Folder',
                                        this.item_info.name,
                                        new_name => { },
                                        () => { NotificationLog.Log('Cancelled Folder Rename', '#fa0'); }
                                    );
                                    overlay.Remove();
                                }
                            },
                            {
                                label: 'Copy Folder Name',
                                color: '#0fa',
                                on_click: overlay =>
                                {
                                    NotificationLog.Log('Copied File Name', '#8ff');
                                    navigator.clipboard.writeText(this.item_info.name);
                                    overlay.Remove();
                                }
                            },
                            {
                                label: 'Copy Folder Path',
                                color: '#0fa',
                                on_click: overlay =>
                                {
                                    NotificationLog.Log('Copied File Path', '#8ff');
                                    navigator.clipboard.writeText('/' + this.explorer.relative_path_current + '/' + this.item_info.name);
                                    overlay.Remove();
                                }
                            },
                            {
                                label: 'Delete Folder',
                                color: '#f40',
                                on_click: overlay =>
                                {
                                    OverlayManager.ShowConfirmDialog(
                                        _ =>
                                        {
                                            const do_delete = _ =>
                                            {
                                                let delete_drive_id = this.explorer.drive_id;
                                                let delete_folder_id = this.item_info.id;

                                                let url_post = SharePoint.url_api + `/drives/${delete_drive_id}/items/${delete_folder_id}`;
                                                SharePoint.SetData(url_post, null, 'delete').then(
                                                    _ =>
                                                    {
                                                        if (_.status == 204) NotificationLog.Log('Deleted folder: ' + this.item_info.name, '#0f0');
                                                        else 
                                                        {
                                                            if (_.status == 403)
                                                            {
                                                                NotificationLog.Log('Could Not Delete folder: Folder has to be empty', '#fc0');

                                                            }
                                                            else
                                                                NotificationLog.Log('Error While Deleting folder: ' + this.item_info.name + ' ||| ' + _.status, '#f50');
                                                        }
                                                        this.explorer.Navigate(this.explorer.relative_path_current);
                                                    }
                                                );
                                            };

                                            if (this.item_info.size > 10240)
                                            {
                                                OverlayManager.ShowConfirmDialog(
                                                    do_delete,
                                                    _ => { NotificationLog.Log('Cancelled folder deletion', '#fa0'); },
                                                    'This folder contains ((' + this.item_info.size + ')) bytes of data.',
                                                    'CONFIRM - DELETE ALL',
                                                    'CANCEL'
                                                );
                                            }
                                            else
                                            {
                                                do_delete(_);
                                            }
                                        },
                                        _ => { NotificationLog.Log('Cancelled folder deletion', '#fa0') },
                                        'Are you sure you want to delete the folder: ((' + this.item_info.name + '))?',
                                        'CONFIRM',
                                        'CANCEL'
                                    );
                                    overlay.Remove();
                                }
                            }
                        ]
                    )
                }
            }
        );
        this.CreateItemButtons(buttons);
    }
}

export class FileExplorer extends PanelContent
{
    site_name = 'ALGInternal';
    drive_name = 'ALGFileLibrary';

    site_id = ''; // cached id for the site where the file store lives
    site_id_valid = false;
    drive_id = ''; // cached id for the root file store
    drive_id_valid = false;

    autonavigate = true;
    show_navigation_bar = true;
    show_folder_actions = true;

    current_items = [];

    constructor(e_parent, site_name = '', drive_name = '')
    {
        super(e_parent);
        if (typeof site_name === 'string' && site_name.length > 0) this.site_name = site_name;
        if (typeof drive_name === 'string' && drive_name.length > 0) this.drive_name = drive_name;
    }

    OnCreateElements()
    {
        this.relative_base_path = '';
        this.relative_path_current = '';

        this.loading_items = false;

        this.e_root = CreatePagePanel(this.e_parent, false, false, null, _ => _.classList.add('file-explorer-root'));
        this.e_root.tabIndex = '0';

        this.load_blocker = addElement(this.e_root, 'div', null, null, _ => _.classList.add('file-explorer-load-blocker'));
        //this.path_dirty = new RunningTimeout(() => { this.Navigate(''); }, 0.5, false, 150);

        this.e_items_root = CreatePagePanel(this.e_root, true, false, null, _ => { _.classList.add('file-explorer-items-root'); });
        this.e_items_container = addElement(this.e_items_root, 'div', 'file-explorer-items-container scroll-y', _ => { _.tabIndex = '0'; });

        if (this.autonavigate === true) this.NavigateAfter(this.base_relative_path ?? '', 330);
    }

    NavigateAfter(relative_path = '', delay = 250)
    {
        this.navigating = true;
        window.setTimeout(
            () =>
            {
                this.Navigate(relative_path);
                this.navigating = false;
            }, delay
        );

    }

    RefreshNavigationBar()
    {
        if (this.show_navigation_bar === true)
        {
            if (this.e_path_root) 
            {
                this.RefreshBackButton();
                return;
            }
            this.e_path_root = CreatePagePanel(this.e_root, true, false, null, _ => _.classList.add('file-explorer-nav-bar'));
            setSiblingIndex(this.e_path_root, 0);

            this.e_path_back = CreatePagePanel(this.e_path_root, false, false, null, _ => _.classList.add('file-explorer-nav-button'));
            this.e_path_back.addEventListener('click', e => { this.TryNavigateBack(this.relative_path_current); });
            this.e_path_back.style.borderWidth = '0';
            this.e_path_back.style.paddingLeft = '0';
            this.e_path_back.style.paddingRight = '0';
            this.e_path_back.style.minWidth = '0';
            this.e_path_back.style.maxWidth = '0';

            this.e_path_label = addElement(this.e_path_root, 'div', 'file-explorer-nav-path');

            this.SetDisplayPath(this.relative_path_current);
        }
        else
        {
            if (this.e_path_root)
            {
                this.e_path_root.remove();
                this.e_path_root = undefined;
                this.e_path_back = undefined;
                this.e_path_label = undefined;
            }
        }
    }

    CreateFolderActionElements()
    {
        if (this.show_folder_actions === true)
        {
            if (this.e_folder_actions_root) return;
            this.e_folder_actions_root = CreatePagePanel(
                this.e_root, true, false, null,
                _ =>
                {
                    const add_button = (_, label = '', tooltip = '', icon = '', color = '#fff', click_action = e => { }) =>
                    {
                        return CreatePagePanel(
                            _, false, false, 'flex-grow:0.0;',
                            _ =>
                            {
                                if (click_action) _.addEventListener('click', click_action);
                                _.innerText = label;
                                _.title = tooltip;
                                if (color && color.length > 0) _.style.setProperty('--theme-color', color);
                                _.style.minWidth = '8rem';
                                _.style.minHeight = '1.5rem';
                                _.style.paddingLeft = '1.5rem';
                                _.style.textAlign = 'center';
                                _.style.alignContent = 'center';
                                _.classList.add('panel-button');

                                if (icon && icon.length > 0) addElement(_, 'i', 'material-icons', 'position:absolute;left:0.5rem;top:50%;transform:translate(0%,-50%);opacity:40%', _ => { _.innerText = icon; });
                            }
                        );
                    };
                    _.classList.add('file-explorer-nav-bar');


                    add_button(
                        _, 'CREATE FOLDER', 'Create a new folder within the current folder.', 'create_new_folder', '#c09f6d',
                        _ => { this.TryCreateNewFolder(); }
                    );
                    add_button(_, 'UPLOAD FILE', 'Upload a file to the current folder.', 'upload', '#4ef');
                }
            );
            setSiblingIndex(this.e_folder_actions_root, 1);
        }
        else
        {
            if (!this.e_folder_actions_root) return;
            this.e_folder_actions_root.remove();
            this.e_folder_actions_root = undefined;
        }
    }

    OnRefreshElements() { }
    OnRemoveElements() { this.e_root.remove(); }

    TryCreateNewFolder()
    {
        const create_sp_folder = async (folder_name) =>
        {
            if (this.drive_id_valid !== true) return undefined;
            let url_post = SharePoint.url_api + `/drives/${this.drive_id}/root:/${this.relative_path_current}:/children`;
            let data_post = { name: folder_name, folder: {} };
            data_post['@microsoft.graph.conflictBehavior'] = 'rename';
            return await SharePoint.SetData(url_post, data_post, 'post');
        };

        OverlayManager.ShowStringDialog(
            'New Folder Name', '',
            folder_name =>
            {
                folder_name = folder_name.trim();
                if (folder_name.length > 0)
                {
                    this.OnStartLoading();
                    create_sp_folder(folder_name).then(
                        resp =>
                        {
                            if (!resp)
                            {
                                NotificationLog.Log(`Failed to Create New Folder: '${folder_name}' (NULL Response)`, '#6f8');
                                return;
                            }
                            if (folder_name == resp.name)
                            {
                                NotificationLog.Log(`Created New Folder: '${folder_name}'`, '#6f8');
                            }
                            else
                            {
                                NotificationLog.Log(`Created New Folder: '${folder_name}' AUTORENAMED TO: '${resp.name}'`, '#f82');
                            }
                            this.Navigate(this.relative_path_current);
                        }
                    );
                }
            },
            () =>
            {
                NotificationLog.Log('Cancelled Create New Folder', '#f86');
            }
        );
    }


    OnStartLoading()
    {
        this.loading_items = true;
        this.load_blocker.style.opacity = '100%';
        this.load_blocker.style.pointerEvents = 'all';
    }

    OnStopLoading()
    {
        this.loading_items = false;
        this.load_blocker.style.opacity = '0%';
        this.load_blocker.style.pointerEvents = 'none';
    }

    DownloadFile(file_url = '') { window.open(file_url, '_blank'); }

    SetDisplayPath(relative_path = '')
    {
        const highlight_prefix = `<span class='file-explorer-nav-path-highlight'>`;
        const highlight_suffix = `</span>`;
        const highlight_last = (_, id, all) =>
        {
            if (id >= (all.length - 1)) return `${highlight_prefix}${_}${highlight_suffix}`;
            return _;
        };

        if (this.e_path_label)
        {
            let path_html = this.drive_name + '/' + relative_path;
            path_html = path_html.split('/').filter(_ => _.length > 0).map(highlight_last).join('/');

            this.e_path_label.innerHTML = path_html;
            this.e_path_label.title = (this.drive_name + '/' + relative_path).split('/').filter(_ => _.length > 0).join(' / ');
        }
    }

    Navigate(relative_path)
    {
        let base_path = typeof this.base_relative_path === 'string' ? this.base_relative_path : '';
        if (typeof relative_path !== 'string' || relative_path.length < 1) relative_path = base_path ?? '';

        this.relative_path_current = relative_path;

        this.e_items_container.innerHTML = '';
        this.OnStartLoading();

        this.FetchFolderItems().then(
            result => 
            {
                this.SetDisplayPath(this.relative_path_current);
                if (result)
                {
                    if (result.status == 404)
                    {
                        this.ShowFolderMessage('404: Folder not found!');
                        this.OnStopLoading();
                    }
                    else
                    {
                        this.PopulateList(result);
                        this.OnStopLoading();
                    }
                }
                else
                {
                    this.ShowFolderMessage('Unexpected Error: Folder items failed to load!');
                    this.OnStopLoading();
                }
            }
        );
    }

    ShowFolderMessage(message)
    {
        addElement(
            this.e_items_container, 'div', null,
            'opacity:50%;height:2rem;line-height:2rem;padding:var(--gap-1);',
            _ => { _.innerText = message; }
        );
    }

    static sort_name = (x, y) => { return x.name.localeCompare(y.name); };

    static sort_type = (x, y) =>
    {
        if (x.folder && y.file) return -1;
        if (x.file && y.folder) return 1;
        return 0;
    };

    static sort_modified = (x, y) =>
    {
        let xdt = new Date(x.lastModifiedDateTime);
        let ydt = new Date(y.lastModifiedDateTime);
        if (xdt > ydt) return -1;
        if (xdt < ydt) return 1;
        return 0;
    };

    static sort_created = (x, y) =>
    {
        let xdt = new Date(x.createdDateTime);
        let ydt = new Date(y.createdDateTime);
        if (xdt > ydt) return -1;
        if (xdt < ydt) return 1;
        return 0;
    };

    TryNavigateBack(relative_path)
    {
        let parent_path_parts = relative_path.split('/');
        parent_path_parts.splice(parent_path_parts.length - 1, 1);
        let parent_path = parent_path_parts.join('/');
        this.Navigate(parent_path);
    }

    RefreshBackButton()
    {
        if (!this.e_path_back) return;

        let base_path_length = typeof this.base_relative_path === 'string' ? this.base_relative_path.length : 0;
        let valid_parent = typeof this.relative_path_current === 'string' && this.relative_path_current.length > base_path_length;
        if (valid_parent === true)
        {
            let parent_path_parts = this.relative_path_current.split('/');
            parent_path_parts.splice(parent_path_parts.length - 1, 1);
            let parent_name = parent_path_parts.splice(parent_path_parts.length - 1, 1);

            this.e_path_back.style.removeProperty('padding-left');
            this.e_path_back.style.removeProperty('padding-right');
            this.e_path_back.style.maxWidth = '4rem';
            this.e_path_back.style.pointerEvents = 'all';
            this.e_path_back.title = 'Navigate back to ' + parent_name;
            this.e_path_back.innerHTML = '← Back';
        }
        else
        {
            this.e_path_back.style.pointerEvents = 'none';
            this.e_path_back.style.paddingRight = '0';
            this.e_path_back.style.paddingLeft = '0';
            this.e_path_back.style.minWidth = '0';
            this.e_path_back.style.maxWidth = '0';
            this.e_path_back.innerHTML = '←';
        }
    }

    PopulateList(items = [])
    {
        this.RefreshNavigationBar();
        this.CreateFolderActionElements();

        if (!items) return;
        if (items.status == 404)
        {
            this.ShowFolderMessage('Folder not found!');
            return;
        }

        if (items.length < 1)
        {
            this.ShowFolderMessage('This folder is empty...');
            return;
        }

        items.sort(FileExplorer.sort_name);
        items.sort(FileExplorer.sort_type);

        for (let id in items)
        {
            let item_instance = new FileExplorerItem(this, items[id]);
            item_instance.CreateElements(this.e_items_container);
        }
    }

    async ValidateSiteId()
    {
        this.site_id_valid = typeof this.site_id === 'string' && this.site_id.length > 0;
        if (this.site_id_valid === true) return;
        if (typeof this.site_name !== 'string' || this.site_name.length < 1) return;
        let site_info = await SharePoint.GetData(SharePoint.url_api + `/sites/${SharePoint.web_name}:/sites/${this.site_name}`);
        if ('id' in site_info) this.site_id = site_info.id;
        this.site_id_valid = typeof this.site_id === 'string' && this.site_id.length > 0;
    }

    async ValidateDriveId()
    {
        await this.ValidateSiteId(this.site_name);
        if (this.site_id_valid !== true) return;

        this.drive_id_valid = typeof this.drive_id === 'string' && this.drive_id.length > 0;
        if (this.drive_id_valid === true) return;

        let drives = (await SharePoint.GetData(SharePoint.url_api + `/sites/${this.site_id}/drives`)).value;
        this.drive_id = drives.filter(_ => _.name === this.drive_name)[0].id;
        this.drive_id_valid = typeof this.drive_id === 'string' && this.drive_id.length > 0;
    }

    async FetchRootFolderId()
    {
        await this.ValidateDriveId(this.site_name);
        return (await SharePoint.GetData(SharePoint.url_api + `/drives/${this.drive_id}/root/children`)).value;
    }

    async FetchFolderItems()
    {
        if (typeof this.relative_path_current === 'string' && this.relative_path_current.length > 0)
        {
            let relative_path_encoded = encodeURIComponent(this.relative_path_current);
            await this.ValidateDriveId();
            const fields = 'id,name,file,folder,size,createdBy,createdDateTime,lastModifiedBy,lastModifiedDateTime,webUrl,@microsoft.graph.downloadUrl';
            let resp = await SharePoint.GetData(SharePoint.url_api + `/drives/${this.drive_id}/root:/${relative_path_encoded}:/children?select=${fields}`);
            if (resp && resp.value) return resp.value;
            return resp;
        }
        else 
        {
            await this.ValidateDriveId();
            let resp = await SharePoint.GetData(SharePoint.url_api + `/drives/${this.drive_id}/root/children`);
            if (resp && resp.value) return resp.value;
            return resp;
        }
    }
}

Modules.Report('File Explorer', 'This module adds a reusable remote library file explorer.');