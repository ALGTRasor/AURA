import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { PanelContent } from "./panel_content.js";
import { Modules } from "../modules.js";
import { SharePoint } from "../sharepoint.js";

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
        const file_button_style = 'display:block; position:absolute;'
            + 'top:50%; left:var(--gap-1); transform:translate(0%,-50%); transform-origin:50% 0%;'
            + 'aspect-ratio:1.0; height:min(1rem, 100%); width:auto;'
            + 'border:solid 2px hsl(from var(--theme-color) h s 50%);'
            + 'background:hsl(from var(--theme-color) h s 30%); cursor:pointer;'
            + 'border-radius:var(--gap-05);';

        _.style.paddingLeft = '4rem';
        _.title = file_info.name;

        addElement(
            _, 'div', 'hover-lift',
            file_button_style,
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
                    e_btn_dl, 'i', 'material-symbols',
                    'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
                    + 'line-height:0.9rem; font-size:0.9rem;',
                    e_icon_dl => { e_icon_dl.innerText = 'download'; }
                );
            }
        );

        const viewable_extensions = ['xlsx', 'pdf', 'docx', 'doc', 'csv', 'txt', 'png', 'jpeg', 'jpg', 'gif'];
        const can_view = file_name => viewable_extensions.indexOf(file_name.split('.').at(-1)) > -1;

        if (can_view(file_info.name) === true)
        {
            addElement(
                _, 'div', 'hover-lift',
                file_button_style + 'left:calc(1.5rem + var(--gap-1));',
                e_btn_view =>
                {
                    e_btn_view.addEventListener('click', e => { window.open(file_info.webUrl, '_blank'); });
                    e_btn_view.title = 'View File Online:\n' + file_info.name;
                    addElement(
                        e_btn_view, 'i', 'material-symbols', 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); line-height:0.9rem; font-size:0.9rem;',
                        e_icon_dl => { e_icon_dl.innerText = 'open_in_new'; }
                    );
                }
            );
        }
    };

    prepare_folder_element = (_, folder_info) =>
    {
        _.style.setProperty('--theme-color', '#fb0');
        _.style.cursor = 'pointer';
        _.style.paddingLeft = '1rem';

        const count_style = 'display:block; position:absolute; top:50%; right:0.5rem; transform:translate(0%, -50%);'
            + 'opacity:80%; font-size:80%;';

        _.innerHTML = folder_info.name;
        _.title = "Open Folder:\n" + folder_info.name;

        if ('childCount' in folder_info.folder) 
        {
            if (folder_info.folder.childCount > 0)
                addElement(_, 'span', null, count_style, _ => { _.innerHTML = folder_info.folder.childCount + ' children' });
            else
                addElement(_, 'span', null, count_style, _ => { _.innerHTML = 'empty'; _.style.color = '#ff0'; });
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
        _.innerHTML = driveitem.name;

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

        this.e_root = CreatePagePanel(
            this.e_parent, false, false,
            'display:flex;flex-direction:column;flex-wrap:nowrap;flex-basis:100%;flex-grow:1.0;flex-shrink:1.0;'
        );

        this.load_blocker = addElement(
            this.e_root, 'div', null,
            'position:absolute; inset:0; z-index:100; user-select:none; cursor:wait;'
            + 'transition-property:opacity; transition-duration:var(--trans-dur-on-slow); transition-timing-function:ease-in-out;'
            + 'backdrop-filter:blur(1px) brightness(80%);'
        );

        //this.path_dirty = new RunningTimeout(() => { this.Navigate(''); }, 0.5, false, 150);
        this.e_path_root = CreatePagePanel(
            this.e_root, true, false,
            'flex-grow:0.0; flex-shrink:0.0; font-size:0.7rem;'
        );

        this.e_path_label = addElement(
            this.e_path_root, 'div', null,
            'position:absolute; inset:0; align-content:center; overflow:hidden;'
            + 'padding-right:var(--gap-05); padding-left:var(--gap-05);'
            + 'padding-top:var(--gap-025); padding-bottom:var(--gap-025);'
            + 'direction:rtl; text-align:left; text-overflow:ellipsis; text-wrap:nowrap; word-wrap:anywhere;'
        );

        this.e_items_root = CreatePagePanel(
            this.e_root, true, false,
            'display:flex; gap:0; flex-direction:column; padding:0;',
            _ => { _.classList.add('scroll-y'); }
        );

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
        const highlight_prefix = `<span style='color:hsl(from var(--theme-color) h s 70%); font-weight:bold;`
            + `font-size:0.8rem; padding:var(--gap-025); background:hsl(from var(--theme-color) h s 30%);`
            + `border-radius:var(--gap-05);'>`;
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

        this.e_items_root.innerHTML = '';
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
                        this.e_items_root.innerHTML = 'FOLDER NOT FOUND';
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
                    this.e_items_root.innerHTML = 'FAILED TO GET PATH ITEMS!';
                    this.OnStopLoading();
                }
            }
        );
    }

    static sort_name = (x, y) =>
    {
        if (x.name > y.name) return 1;
        if (x.name < y.name) return -1;
        return 0;
    };

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

    PopulateList(relative_path = '', items = [])
    {
        if (!items) return;
        if (items.status == 404) return;

        items.sort(FileExplorer.sort_name);
        items.sort(FileExplorer.sort_type);

        let valid_parent = typeof relative_path === 'string' && relative_path.length > (typeof this.base_relative_path === 'string' ? this.base_relative_path.length : 0);
        if (valid_parent === true)
        {
            CreatePagePanel(
                this.e_items_root, false, false,
                'font-size:0.7rem; flex-grow:0.0; align-self:flex-start; padding:calc(var(--gap-05) + 0.25rem); box-shadow:none;',
                _ =>
                {
                    let parent_path_parts = relative_path.split('/');
                    parent_path_parts.splice(parent_path_parts.length - 1, 1);
                    const parent_path = parent_path_parts.join('/');
                    let parent_name = parent_path_parts.splice(parent_path_parts.length - 1, 1);
                    this.prepare_item_element(_, { folder: {}, webUrl: parent_path, name: '← ' + parent_name });
                }
            );
        }

        for (let id in items)
        {
            CreatePagePanel(
                this.e_items_root, false, false,
                'font-size:0.75rem; flex-grow:0.0; flex-shrink:0.0; border-radius:0; box-shadow:none;',
                _ => this.prepare_item_element(_, items[id])
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
            let resp = await SharePoint.GetData(SharePoint.url_api + `/drives/${FileExplorer.drive_id}/root:/${relative_path}:/children?select=id,name,file,folder,createdBy,createdDateTime,lastModifiedBy,lastModifiedDateTime,webUrl,@microsoft.graph.downloadUrl`);
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