import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { PanelContent } from "./panel_content.js";
import { Modules } from "../modules.js";
import { SharePoint } from "../sharepoint.js";
import { FileTypes } from "../utils/filetypes.js";

export class FileExplorer extends PanelContent
{
    static root_library_name = 'ALGFileLibrary';

    autonavigate = true;

    DetermineFileType(item_info = {})
    {
        let type_str = 'unknown';
        if ('folder' in item_info) type_str = 'folder';
        if ('file' in item_info) type_str = 'file';
        return type_str;
    }

    get_item_created_string = item_info =>
    {
        if ('createdBy' in item_info && 'user' in item_info.createdBy)
        {
            let d = new Date(item_info.createdDateTime).toLocaleString();
            return `Created by ${item_info.createdBy.user.displayName} @ ${d}`;
        }
        return undefined;
    };

    get_item_modified_string = item_info =>
    {
        if ('lastModifiedBy' in item_info && 'user' in item_info.lastModifiedBy)
        {
            let d = new Date(item_info.lastModifiedDateTime).toLocaleString();
            return `Modified by ${item_info.lastModifiedBy.user.displayName} @ ${d}`;
        }
        return undefined;
    };

    prepare_file_element = (_, file_info) =>
    {
        _.classList.add('file-explorer-file');

        let item_type_info = FileTypes.GetInfo(file_info.name);
        _.title = file_info.name;

        addElement(
            _, 'div', 'file-explorer-item-info', null,
            _ =>
            {
                addElement(
                    _, 'span', null, 'padding:var(--gap-05); border-radius:var(--gap-05);',
                    _ =>
                    {
                        if (item_type_info)
                        {
                            _.innerHTML = item_type_info.label;
                            _.title = item_type_info.description;
                            _.style.backgroundColor = 'hsl(from ' + item_type_info.color + ' h 50% 25%)';
                        }
                        else
                            _.innerHTML = 'file';
                    }
                );
            }
        );

        let e_btn_root = CreatePagePanel(_, true, false, null, _ => _.classList.add('file-explorer-item-buttons-root'));

        addElement(
            e_btn_root, 'div', 'file-explorer-item-button', null,
            e_btn_dl =>
            {
                e_btn_dl.addEventListener(
                    'click',
                    e =>
                    {
                        if (this.loading_items === true) return;
                        this.DownloadFile(file_info['@microsoft.graph.downloadUrl']);
                    }
                );
                e_btn_dl.title = 'Download File:\n' + file_info.name;
                addElement(
                    e_btn_dl, 'i', 'material-symbols', null,
                    e_icon_dl => { e_icon_dl.innerText = 'download'; }
                );
            }
        );

        if (item_type_info && item_type_info.viewable === true)
        {
            addElement(
                e_btn_root, 'div', 'file-explorer-item-button', null,
                e_btn_view =>
                {
                    e_btn_view.addEventListener('click', e => { window.open(file_info.webUrl, '_blank'); });
                    e_btn_view.title = 'View File Online:\n' + file_info.name;
                    addElement(
                        e_btn_view, 'i', 'material-symbols', null,
                        e_icon_dl => { e_icon_dl.innerText = 'open_in_new'; }
                    );
                }
            );
        }

        addElement(
            e_btn_root, 'div', 'file-explorer-item-button', null,
            e_btn =>
            {
                e_btn.addEventListener('click', e => { });
                e_btn.title = 'More Options';
                addElement(
                    e_btn, 'i', 'material-symbols', null,
                    e_icon => { e_icon.innerText = 'more'; }
                );
            }
        );
    };

    prepare_folder_element = (_, folder_info) =>
    {
        _.classList.add('file-explorer-folder');
        _.title = "Open Folder:\n" + folder_info.name;

        if ('childCount' in folder_info.folder) 
        {
            if (folder_info.folder.childCount > 0)
                addElement(_, 'span', 'file-explorer-item-info', null, _ => { _.innerHTML = 'folder: ' + folder_info.folder.childCount + ' items' });
            else
                addElement(_, 'span', 'file-explorer-item-info', null, _ => { _.innerHTML = 'empty folder'; _.style.color = '#ff0'; });
        }
        else _.style.setProperty('--theme-color', '#fa47');

        _.addEventListener(
            'click',
            _ =>
            {
                if (this.loading_items === true) return;
                const rgx_get_rel_path = /(https?:\/\/[\w\.]+\.com)\/sites\/([^\/]+)\/([^\/]+)\/(.+)/;
                let rgxmatch = decodeURIComponent(folder_info.webUrl).match(rgx_get_rel_path);
                if (rgxmatch) this.Navigate(rgxmatch[4]);
                else this.Navigate(folder_info.webUrl);
            }
        );
    };

    prepare_item_element = (_, driveitem) =>
    {
        addElement(_, 'span', 'file-explorer-item-title', null, _ => { _.innerHTML = driveitem.name; });

        driveitem.type = this.DetermineFileType(driveitem);

        switch (driveitem.type)
        {
            case 'file':
                this.prepare_file_element(_, driveitem);
                break;
            case 'folder':
                this.prepare_folder_element(_, driveitem);
                break;
        }

        let createdBy = this.get_item_created_string(driveitem);
        if (createdBy) _.title += '\n' + createdBy;

        let modifiedBy = this.get_item_modified_string(driveitem);
        if (modifiedBy) _.title += '\n' + modifiedBy;
    };




    OnCreateElements()
    {
        this.relative_base_path = '';
        this.relative_path_current = '';

        this.loading_items = false;

        this.e_root = CreatePagePanel(this.e_parent, false, false, null, _ => _.classList.add('file-explorer-root'));
        this.e_root.tabIndex = '0';

        this.load_blocker = addElement(this.e_root, 'div', null, null, _ => _.classList.add('file-explorer-load-blocker'));
        //this.path_dirty = new RunningTimeout(() => { this.Navigate(''); }, 0.5, false, 150);

        this.e_path_root = CreatePagePanel(this.e_root, true, false, null, _ => _.classList.add('file-explorer-nav-bar'));

        this.e_path_back = CreatePagePanel(this.e_path_root, false, false, null, _ => _.classList.add('file-explorer-nav-button'));
        this.e_path_back.addEventListener('click', e => { this.TryNavigateBack(this.relative_path_current); });
        this.e_path_back.style.borderWidth = '0';
        this.e_path_back.style.paddingLeft = '0';
        this.e_path_back.style.paddingRight = '0';
        this.e_path_back.style.minWidth = '0';
        this.e_path_back.style.maxWidth = '0';

        this.e_path_label = addElement(this.e_path_root, 'div', 'file-explorer-nav-path');

        this.e_items_root = CreatePagePanel(
            this.e_root, true, false, null,
            _ =>
            {
                _.classList.add('file-explorer-items-root');
            }
        );
        this.e_items_container = addElement(this.e_items_root, 'div', 'file-explorer-items-container scroll-y', _ => { _.tabIndex = '0'; });

        if (this.autonavigate === true) window.setTimeout(() => { this.Navigate(this.base_relative_path ?? ''); }, 250);
    }
    OnRefreshElements() { }
    OnRemoveElements() { this.e_root.remove(); }


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

        let path_html = FileExplorer.root_library_name + '/' + relative_path;
        path_html = path_html.split('/').filter(_ => _.length > 0).map(highlight_last).join('/');
        this.e_path_label.innerHTML = path_html;
        this.e_path_label.title = (FileExplorer.root_library_name + '/' + relative_path).split('/').filter(_ => _.length > 0).join(' / ');
    }

    Navigate(relative_path)
    {
        if (typeof relative_path !== 'string' || relative_path.length < 1) relative_path = this.base_relative_path ?? '';
        this.relative_path_current = relative_path;

        this.SetDisplayPath(this.relative_path_current);

        this.e_items_container.innerHTML = '';
        this.OnStartLoading();

        FileExplorer.FetchFolderItems(
            'ALG Internal', this.relative_path_current
        ).then(
            result => 
            {
                if (result)
                {
                    if (result.status == 404)
                    {
                        this.e_items_container.innerHTML = 'FOLDER NOT FOUND';
                        this.OnStopLoading();
                    }
                    else
                    {
                        this.PopulateList(this.relative_path_current, result);
                        this.OnStopLoading();
                    }
                }
                else
                {
                    this.e_items_container.innerHTML = 'FAILED TO GET PATH ITEMS!';
                    this.OnStopLoading();
                }
            }
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

    PopulateList(relative_path = '', items = [])
    {
        if (!items) return;
        if (items.status == 404) return;

        items.sort(FileExplorer.sort_name);
        items.sort(FileExplorer.sort_type);

        let valid_parent = typeof relative_path === 'string' && relative_path.length > (typeof this.base_relative_path === 'string' ? this.base_relative_path.length : 0);
        if (valid_parent === true)
        {
            let parent_path_parts = relative_path.split('/');
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

        for (let id in items)
        {
            CreatePagePanel(
                this.e_items_container, false, false, null,
                _ =>
                {
                    _.classList.add('file-explorer-item');
                    this.prepare_item_element(_, items[id]);
                    _.tabIndex = '0';
                }
            );
        }
    }

    static site_id = ''; // cached id for the site where the file store lives
    static drive_id = ''; // cached id for the root file store

    static async ValidateDriveId(site_name = '')
    {
        let drive_id_invalid = typeof FileExplorer.drive_id !== 'string' || FileExplorer.drive_id.length < 1;
        let site_id_invalid = typeof FileExplorer.site_id !== 'string' || FileExplorer.site_id.length < 1;
        if (drive_id_invalid || site_id_invalid)
        {
            if (site_id_invalid)
            {
                if (typeof site_name !== 'string' || site_name.length < 1) return;
                FileExplorer.site_id = (await SharePoint.GetData(SharePoint.url_api + `/sites?search=${site_name}`)).value[0].id;
            }

            let drives = (await SharePoint.GetData(SharePoint.url_api + `/sites/${FileExplorer.site_id}/drives`)).value;
            FileExplorer.drive_id = drives.filter(_ => _.name === 'ALGFileLibrary')[0].id;
        }
    }

    static async FetchRootFolderId(site_name = '')
    {
        await FileExplorer.ValidateDriveId(site_name);
        return (await SharePoint.GetData(SharePoint.url_api + `/drives/${FileExplorer.drive_id}/root/children`)).value;
    }

    static async FetchFolderItems(site_name = '', relative_path = '')
    {
        if (typeof relative_path === 'string' && relative_path.length > 0)
        {
            relative_path = encodeURIComponent(relative_path);
            await FileExplorer.ValidateDriveId(site_name);
            const fields = 'id,name,file,folder,createdBy,createdDateTime,lastModifiedBy,lastModifiedDateTime,webUrl,@microsoft.graph.downloadUrl';
            let resp = await SharePoint.GetData(SharePoint.url_api + `/drives/${FileExplorer.drive_id}/root:/${relative_path}:/children?select=${fields}`);
            if (resp && resp.value) return resp.value;
            return resp;
        }
        else 
        {
            await FileExplorer.ValidateDriveId(site_name);
            let resp = await SharePoint.GetData(SharePoint.url_api + `/drives/${FileExplorer.drive_id}/root/children`);
            if (resp && resp.value) return resp.value;
            return resp;
        }
    }
}

Modules.Report('File Explorer', 'This module adds a reusable remote library file explorer.');