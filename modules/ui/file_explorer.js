import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { PanelContent } from "./panel_content.js";
import { Modules } from "../modules.js";
import { SharePoint } from "../sharepoint.js";

export class FileExplorer extends PanelContent
{
    static root_library_name = 'ALGFileLibrary';

    OnCreateElements()
    {
        this.relative_path_current = '';

        this.loading_items = false;

        this.e_root = CreatePagePanel(
            this.e_parent, false, false,
            'display:flex;flex-direction:column;flex-wrap:nowrap;flex-basis:100%;flex-grow:1.0;flex-shrink:1.0;'
        );

        this.load_blocker = addElement(
            this.e_root, 'div', null,
            'position:absolute;inset:0;z-index:100;user-select:none;cursor:wait;'
            + 'transition-property:opacity; transition-duration:var(--trans-dur-on-slow); transition-timing-function:ease-in-out;'
            + 'backdrop-filter:blur(1px) brightness(80%);'
        );

        //this.path_dirty = new RunningTimeout(() => { this.Navigate(''); }, 0.5, false, 150);
        this.e_path_root = CreatePagePanel(
            this.e_root, true, false,
            'flex-grow:0.0; flex-shrink:0.0; font-size:0.7rem;'
            + 'direction:rtl; padding-right:calc(var(--gap-1) + 2px); padding-left:calc(var(--gap-1) + 2px);'
            + 'align-content:center; text-align:left; text-overflow:ellipsis; text-wrap:nowrap; word-wrap:anywhere;',
            _ => _.innerHTML = 'root'
        );

        this.e_items_root = CreatePagePanel(
            this.e_root, true, false,
            'display:flex;flex-direction:column;gap:var(--gap-025);',
            _ => { _.classList.add('scroll-y'); }
        );

        window.setTimeout(() => { this.Navigate(this.base_relative_path ?? ''); }, 250);

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

    DownloadFile(file_url = '')
    {
        window.open(file_url, '_blank');
        return;

        if ('e_file_view' in this && 'remove' in this.e_file_view) this.e_file_view.remove();
        this.e_file_view = CreatePagePanel(
            this.e_root, true, false, 'all:unset; display:block; position:absolute; pointer-events:none; width:0; height:0;',
            _ => { _.innerHTML = `<embed src="${file_url}" width="500" height="375" type="application/pdf">`; }
        );
    }

    Navigate(relative_path)
    {
        this.relative_path_current = relative_path;

        let path_html = FileExplorer.root_library_name + '/' + relative_path;

        const highlight_prefix = `<span style='color:hsl(from var(--theme-color) h s 70%); font-weight:bold; font-size:0.8rem; padding:var(--gap-025); background:hsl(from var(--theme-color) h s 30%); border-radius:var(--gap-05);'>`;
        const highlight_suffix = `</span>`;
        const highlight_last = (_, id, all) =>
        {
            if (id >= (all.length - 1)) return `${highlight_prefix}${_}${highlight_suffix}`;
            return _;
        };
        path_html = path_html.split('/').filter(_ => _.length > 0).map(highlight_last).join('/');
        this.e_path_root.innerHTML = path_html;
        this.e_path_root.title = (FileExplorer.root_library_name + '/' + relative_path).split('/').filter(_ => _.length > 0).join(' / ');

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
                                if (this.loading_items === true) return;
                                this.DownloadFile(driveitem['@microsoft.graph.downloadUrl']);
                            }
                        );
                        e_btn_dl.title = 'Download File:\n' + driveitem.name;
                        addElement(
                            e_btn_dl, 'i', 'material-symbols', 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); line-height:0.9rem; font-size:0.9rem;',
                            e_icon_dl => { e_icon_dl.innerText = 'download'; }
                        );
                    }
                );

                const viewable_extensions = ['xlsx', 'pdf', 'docx', 'doc', 'csv', 'txt', 'png', 'jpeg', 'jpg', 'gif'];
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
                        if (this.loading_items === true) return;
                        let rgxmatch = decodeURIComponent(driveitem.webUrl).match(rgx_get_rel_path);
                        if (rgxmatch) this.Navigate(rgxmatch[4]);
                        else this.Navigate(driveitem.webUrl);
                    }
                );
            }
            if ('createdBy' in driveitem && 'user' in driveitem.createdBy) _.title += `\nCreated by ${driveitem.createdBy.user.displayName} (${driveitem.createdBy.user.email})`;
            if ('lastModifiedBy' in driveitem && 'user' in driveitem.lastModifiedBy) _.title += `\nModified by ${driveitem.lastModifiedBy.user.displayName} (${driveitem.lastModifiedBy.user.email})`;
        };

        this.e_items_root.innerHTML = '';
        this.OnStartLoading();

        FileExplorer.FetchFolderItems('ALG Internal', relative_path).then(
            items => 
            {


                if (items)
                {
                    let valid_path = typeof relative_path === 'string' && relative_path.length > (typeof this.base_relative_path === 'string' ? this.base_relative_path.length : 0);
                    if (valid_path)
                    {
                        CreatePagePanel(
                            this.e_items_root, false, false,
                            'font-size:0.7rem; flex-grow:0.0;',
                            _ =>
                            {
                                let parent_path_parts = relative_path.split('/');
                                parent_path_parts.splice(parent_path_parts.length - 1, 1);
                                const parent_path = parent_path_parts.join('/');
                                prep_driveitem_element(_, { folder: {}, webUrl: parent_path, name: '← back to ' + FileExplorer.root_library_name + '/' + parent_path });
                            }
                        );
                    }

                    for (let id in items)
                    {
                        CreatePagePanel(
                            this.e_items_root, false, false,
                            'font-size:0.7rem; flex-grow:0.0; flex-shrink:0.0;',
                            _ => prep_driveitem_element(_, items[id])
                        );
                    }
                    this.OnStopLoading();
                }
                else
                {
                    this.e_items_root.innerHTML = 'FAILED TO GET PATH ITEMS!';
                    this.OnStopLoading();
                }
            }
        );
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
            return (await SharePoint.GetData(SharePoint.url_api + `/drives/${FileExplorer.drive_id}/root:/${relative_path}:/children?select=id,name,file,folder,createdBy,lastModifiedBy,webUrl,@microsoft.graph.downloadUrl`)).value;
        }
        else 
        {
            await FileExplorer.ValidateDriveId(site_name);
            return (await SharePoint.GetData(SharePoint.url_api + `/drives/${FileExplorer.drive_id}/root/children`)).value;
        }
    }
}

Modules.Report('File Explorer', 'This module adds a reusable remote library file explorer.');