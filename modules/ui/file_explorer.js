import { Modules } from "../modules.js";
import { addElement, ClearElementLoading, CreatePagePanel, getTransitionStyle, MarkElementLoading, setSiblingIndex, setTransitionStyle } from "../utils/domutils.js";
import { DOMHighlight } from "../ui/domhighlight.js";
import { bytes_mb, get_file_size_group } from "../utils/filesizes.js";
import { FileTypes } from "../utils/filetypes.js";
import { LongOps } from "../systems/longops.js";
import { OverlayManager } from "./overlays.js";

import { NotificationLog } from "../notificationlog.js";
import { PanelContent } from "./panel_content.js";
import { Trench } from "./trench.js";
import { MegaTips } from "../systems/megatips.js";
import { SelectionInstance } from "../utils/selections.js";


const add_button = (e_parent, label = '', tooltip = '', icon = '', color = '#fff', click_action = e => { }) =>
{
    return CreatePagePanel(
        e_parent, false, false, 'display:flex; flex-direction:row; flex-grow:0.0; flex-shrink:0.0;',
        _ =>
        {
            if (click_action) _.addEventListener('click', click_action);
            _.title = tooltip;
            if (color && color.length > 0) _.style.setProperty('--theme-color', color);
            _.style.minWidth = '1rem';
            _.style.minHeight = '1rem';
            _.style.paddingRight = 'var(--gap-1)';
            _.style.textAlign = 'center';
            _.style.alignContent = 'center';
            _.classList.add('panel-button');
            if (typeof icon === 'string' && icon.length > 0) addElement(_, 'i', 'material-icons', 'font-size:1rem; line-height:1rem; opacity:40%; align-content:center; text-align:center;', _ => { _.innerText = icon; });
            if (typeof label === 'string' && label.length > 0) addElement(_, 'div', undefined, 'height:100%; align-content:center; text-align:center;', _ => { _.innerText = label; });
        }
    );
};


export class FileUploadInstance extends EventTarget
{
    constructor(file, drive_id = '', relative_path = '')
    {
        super();

        this.file = file;
        this.drive_id = drive_id;
        this.relative_path = relative_path;

        this.file_name = this.file.name.trim();
        this.operation_id = 'upload-file' + this.file_name;
        this.url_content = window.SharePoint.url_api + `/drives/${this.drive_id}/root:/${this.relative_path}/${this.file_name}:/content`;

        this.contents_read = false;
        this.submitted = false;
        this.success = false;

        this.file_contents = undefined;
        this.op_upload = undefined;
        this.result = undefined;
    }

    async Process()
    {
        this.success = false;
        this.op_upload = LongOps.Start(this.operation_id, { label: this.file_name, icon: 'upload', verb: 'Uploaded file' });
        //this.InitWorker();
        //await until(() => this.contents_read === true);
        await this.ReadFileContents();
        await this.SubmitFileContents();
        LongOps.Stop(this.op_upload);

        this.file = undefined;
        this.file_contents = undefined;
    }

    async ReadFileContents()
    {
        if (this.contents_read === true) return;
        this.file_contents = await this.file.arrayBuffer();
        this.contents_read = true;

        this.dispatchEvent(new CustomEvent('afterread', {}));
    }

    async SubmitFileContents()
    {
        if (typeof this.drive_id !== 'string' || this.drive_id.length < 1) 
        {
            console.warn('Invalid Drive ID');
            return undefined;
        }

        if (this.submitted === true) return;
        this.result = await window.SharePoint.SetData(this.url_content, this.file_contents, 'put', 'text/plain');
        this.submitted = true;

        this.dispatchEvent(new CustomEvent('afterupload', {}));
    }
}


export class ItemDeleteInstance extends EventTarget
{
    constructor(item_info, drive_id = '', relative_path = '')
    {
        super();

        this.item_info = item_info;
        this.drive_id = drive_id;
        this.relative_path = relative_path;

        this.operation_id = 'delete-item' + this.item_info.id;
        this.url_content = `${window.SharePoint.url_api}/drives/${this.drive_id}/items/${this.item_info.id}`;

        this.submitted = false;

        this.op = undefined;
        this.result = undefined;
    }

    async Process()
    {
        if (this.submitted === true) return;
        this.op = LongOps.Start(this.operation_id, { label: this.item_info.name, icon: 'delete_forever', verb: ('folder' in this.item_info) ? 'Deleted folder' : 'Deleted file' });
        await this.Submit();
    }

    async Submit()
    {
        if (this.submitted === true) return;
        if (typeof this.drive_id !== 'string' || this.drive_id.length < 1) 
        {
            LongOps.Stop(this.op, 'Invalid Drive ID');
            return undefined;
        }

        this.submitted = true;
        this.result = await window.SharePoint.SetData(this.url_content, null, 'delete');

        switch (this.result.status)
        {
            case undefined:
            case 204:
                //NotificationLog.Log(`Deleted '${this.item_info.name}'`, '#0f0');
                LongOps.Stop(this.op);
                break;
            case 403: if ('folder' in this.item_info) LongOps.Stop(this.op, '403 Forbidden: Folder must be empty'); else LongOps.Stop(this.op, '403 Forbidden'); break;
            case 404: LongOps.Stop(this.op, '404 Item Not Found'); break;
            default: LongOps.Stop(this.op, `STATUS( ${this.result.status} )`); break;
        }

        this.dispatchEvent(new CustomEvent('completed', { detail: this.result }));
    }
}


class FileExplorerHeaderRow
{
    constructor(explorer = {})
    {
        this.explorer = explorer;
    }

    CreateElements()
    {
        this.e_root = CreatePagePanel(
            this.explorer.e_items_root, false, false, 'display:flex; flex-direction:row; flex-wrap:nowrap; padding:var(--gap-025) var(--gap-1) var(--gap-025) var(--gap-1); border-radius:var(--gap-025);',
            _ =>
            {
                _.classList.add('file-explorer-item');

                if (this.explorer.allow_multiselect === true)
                {
                    this.e_checkbox = addElement(
                        _, 'i', 'material-symbols icon-button', '',
                        _ => { _.innerText = 'playlist_add_check_circle'; }
                    );


                    this.e_checkbox.addEventListener(
                        'click',
                        e =>
                        {
                            if (e.ctrlKey === true) this.ToggleAllSelected();
                            else this.TrySelectAll(e.shiftKey === true ? 'file' : undefined);
                        }
                    );
                    MegaTips.RegisterSimple(this.e_checkbox, 'Select / Deselect All<br>(((Hold [[[CTRL]]] to toggle selected)))');
                }

                this.e_name = addElement(_, 'span', 'file-explorer-item-title', null, _ => { _.innerText = 'NAME'; });
            }
        );
    }



    ToggleAllSelected()
    {
        for (let item_id in this.explorer.current_items)
        {
            let item = this.explorer.current_items[item_id];
            item.ToggleSelected();
        }
    }

    TrySelectAll(target_type = '')
    {
        let any_changed = false;
        let has_target = typeof target_type === 'string' && target_type.length > 0;

        for (let item_id in this.explorer.current_items)
        {
            let item = this.explorer.current_items[item_id];
            if (has_target === true && !(target_type in item.item_info)) continue;
            if (this.explorer.SelectItem(item)) any_changed = true;
        }

        if (any_changed !== true)
        {
            this.explorer.ClearSelected();
        }
    }
}


class FileExplorerItem
{
    constructor(explorer = {}, item_info = {})
    {
        this.explorer = explorer;
        this.item_info = item_info;
        this.item_type = 'unknown';
        this.tooltips = [];

        this.DetermineFileType();
        this.item_type_info = FileTypes.GetInfo(this.item_info.name);

        this.AddTooltip(this.item_type.toUpperCase(), this.item_info.name);
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

        if (hasUser && hasDate) this.AddTooltip(verb, `${valUser.user.displayName} @ ${new Date(valDate).toLocaleString()}`);
        else if (hasUser && !hasDate) this.AddTooltip(verb, valUser.user.displayName);
        else if (!hasUser && hasDate) this.AddTooltip(verb, new Date(valDate).toLocaleString());
    }

    AddTooltip(label = '', info = '', warning = false)
    {
        let has_label = typeof label === 'string' && label.length > 0;
        let has_info = typeof info === 'string' && info.length > 0;
        if (has_label !== true && has_info !== true) return;

        let has_both = has_label && has_info;
        let tip = has_both ? `(((${label}))) ${info}` : (has_label ? `(((${label})))` : `${info}`);
        if (tip.length < 1) return;

        if (warning === true) tip = `[[[${tip}]]]`;
        tip += '<br>';

        this.tooltips.push(tip);
    }

    GetSelectionIndex() { return this.explorer.GetSelectionIndex(this); }

    ToggleSelected(e)
    {
        this.explorer.ToggleSelectedItem(this);
        this.RefreshSelected();
        e?.stopPropagation();
    }

    TrySetSelected(selected = true)
    {
        if (selected) this.explorer.SelectItem(this);
        else this.explorer.DeselectItem(this);
        this.RefreshSelected();
    }

    CreateElements(e_parent)
    {
        this.e_parent = e_parent;

        this.e_root = CreatePagePanel(
            this.e_parent, false, false, 'display:flex;flex-direction:row;flex-wrap:nowrap;',
            _ =>
            {
                _.classList.add('file-explorer-item');
                _.tabIndex = '0';

                if (this.explorer.allow_multiselect === true)
                {
                    this.e_checkbox = addElement(
                        _, 'i', 'material-symbols',
                        'aspect-ratio:1.0; max-width:1rem; flex-grow:0.0; flex-shrink:0.0; cursor:pointer; pointer-events:all;'
                        + 'align-content:center; text-align:center; font-size:1.25rem;',
                        _ => _.innerText = 'check_box_outline_blank'
                    );
                    MegaTips.RegisterSimple(this.e_checkbox, `(((Add / Remove))) ${this.item_info.name} (((from Selection)))`);
                }

                this.e_name = addElement(_, 'span', 'file-explorer-item-title', null, _ => { _.innerText = this.item_info.name; });
            }
        );

        switch (this.item_type)
        {
            case 'file': this.CreateFileElements(); break;
            case 'folder': this.CreateFolderElements(); break;
            case 'bundle': this.CreateFolderElements(); break;
        }

        this.AddTimestampTooltip('createdBy', 'createdDateTime', 'CREATED');
        this.AddTimestampTooltip('lastModifiedBy', 'lastModifiedDateTime', 'MODIFIED');

        switch (this.item_type)
        {
            case 'file':
                this.AddTooltip(undefined, 'Click to select', true);
                this.AddTooltip(undefined, 'Double-click to open', true);
                break;
            case 'folder': this.AddTooltip(undefined, 'Click to open folder', true); break;
            case 'bundle': this.AddTooltip(undefined, 'Click to open folder', true); break;
        }

        MegaTips.RegisterSimple(this.e_root, this.tooltips.join(''));

        this.RefreshElements();
        this.RefreshSelected();
    }

    RefreshSelected()
    {
        this.is_selected = this.explorer.selection.contains(this.item_info);
        if (this.is_selected === true)
        {
            this.e_root.style.backgroundImage = 'linear-gradient(45deg, rgb(from hsl(from var(--theme-color) h s 50%) r g b / 0.5), transparent)';
            this.e_checkbox.style.opacity = '100%';
            this.e_checkbox.style.color = 'white';
            this.e_checkbox.innerText = 'select_check_box';
            this.e_name.style.color = 'white';
        }
        else
        {
            this.e_root.style.backgroundImage = 'none';
            this.e_checkbox.style.opacity = '30%';
            this.e_checkbox.style.color = 'hsl(from var(--theme-color) h s 50%)';
            this.e_checkbox.innerText = 'check_box_outline_blank';
            this.e_name.style.color = 'unset';
        }
    }

    RemoveElements() { this.e_root.remove(); }

    RequestDelete()
    {
        this.explorer.OnStartLoading();
        const longop = LongOps.Start('driveitem-delete-' + this.item_info.id, { label: this.item_info.name, icon: 'delete_forever', verb: 'Deleted file' });
        let url_post = `${window.SharePoint.url_api}/drives/${this.explorer.drive_id}/items/${this.item_info.id}`;
        window.SharePoint.SetData(
            url_post, null, 'delete'
        ).then(
            _ =>
            {
                if (_.status == 204) 
                {
                    //NotificationLog.Log(`Deleted ${this.item_type}: ${this.item_info.name}`, '#0f0');
                    LongOps.Stop(longop);
                }
                else 
                {
                    if (_.status == 403 && this.item_type === 'folder') NotificationLog.Log('Could Not Delete folder: It must be empty first', '#fc0');
                    else NotificationLog.Log(`Error While Deleting ${this.item_type}: ${this.item_info.name} ||| ${_.status}`, '#f50');
                    LongOps.Stop(longop, 'Error ' + _.status);
                    if (_.status == 404) this.WarnNotFound('Deleting');
                }
                this.explorer.DeselectItem(this);
                this.explorer.Navigate(this.explorer.relative_path_current);
            }
        );
    }

    RequestRename()
    {
        if (this.explorer.drive_id_valid !== true) return undefined;
        OverlayManager.ShowStringDialog(
            `Renaming ${this.item_type}: '${this.item_info.name}'`,
            this.item_info.name,
            new_name =>
            {
                let any_changed = new_name !== this.item_info.name;
                let type_prev = FileTypes.GetInfo(this.item_info.name);
                let type_next = FileTypes.GetInfo(new_name);
                let extension_changed = (type_next?.label ?? 'NULL') !== (type_prev?.label ?? 'NULL');

                const execute = () =>
                {
                    const longop = LongOps.Start('driveitem-rename-' + this.item_info.id, { label: this.item_info.name, icon: 'edit_square', verb: 'Renamed item' });
                    let url_post = `${window.SharePoint.url_api}/drives/${this.explorer.drive_id}/items/${this.item_info.id}`;
                    window.SharePoint.SetData(
                        url_post, { name: new_name }, 'put'
                    ).then(
                        _ =>
                        {
                            if ('status' in _)
                            {
                                NotificationLog.Log(`Error While Renaming '${this.item_info.name}' ||| ${_.status}`, '#f50');
                                LongOps.Stop(longop, 'Error ' + _.status);
                                if (_.status == 404) this.WarnNotFound('Renaming');
                            }
                            else
                            {
                                NotificationLog.Log(`Renamed '${this.item_info.name}' -> '${new_name}'`, '#0f0');
                                this.explorer.Navigate(this.explorer.relative_path_current);
                                LongOps.Stop(longop);
                            }
                        }
                    );
                };

                if (extension_changed === true)
                {
                    OverlayManager.ShowConfirmDialog(
                        _ => { execute(); OverlayManager.DismissOne(); },
                        _ => { OverlayManager.DismissOne(); },
                        MegaTips.FormatHTML(`{{{Change File Extension:}}} ${type_prev?.label} {{{to}}} ${type_next?.label}`)
                    )
                }
                else
                {
                    execute();
                }
            },
            () =>
            {
                NotificationLog.Log(`Cancelled ${this.item_type} Rename`, '#fa0');
            }
        );
    }

    WarnNotFound(verb = 'making changes')
    {
        this.explorer.DeselectItem(this);
        OverlayManager.ShowChoiceDialog(`Error while ${verb}: ` + 'The file no longer exists!', [{ label: 'OKAY', on_click: o => { OverlayManager.DismissOne(); this.explorer.Navigate(this.explorer.relative_path_current); }, color: '#0f0' }]);
    }

    RequestCopy()
    {
        const rgx_filename_no_index = /(.+)(\..+)/;
        const rgx_filename_index = /(.+)(?:\((\d+)\))(\..+)/;
        const increment_filename = name =>
        {
            let match = name.match(rgx_filename_index);
            if (match)
            {
                let part_name = match[1].trim();
                let part_index = (Number.parseInt(match[2]) ?? 0) + 1;
                let part_ext = match[3].trim();
                name = `${part_name} (${part_index})${part_ext}`;
            }
            else
            {
                match = name.match(rgx_filename_no_index);
                if (match)
                {
                    let part_name = match[1].trim();
                    let part_ext = match[2].trim();
                    name = `${part_name} (1)${part_ext}`;
                }
            }
            return name;
        };

        if (this.explorer.drive_id_valid !== true) return undefined;
        OverlayManager.ShowConfirmDialog(
            _ =>
            {
                const longop = LongOps.Start('driveitem-copy-' + this.item_info.id, { label: this.item_info.name, icon: 'content_copy', verb: 'Duplicated item' });
                let body =
                {
                    parentReference:
                    {
                        driveId: this.item_info.parentReference.driveId,
                        id: this.item_info.parentReference.id
                    },
                    name: increment_filename(this.item_info.name)
                };
                let url = `${window.SharePoint.url_api}/drives/${this.explorer.drive_id}/items/${this.item_info.id}/copy?@microsoft.graph.conflictBehavior=rename`;
                window.SharePoint.SetData(
                    url, body
                ).then(
                    _ =>
                    {
                        if ('status' in _ && _.status != 202)
                        {
                            NotificationLog.Log(`Error While Duplicating '${this.item_info.name}': ${_.status}`, '#f50');
                            LongOps.Stop(longop, 'Error ' + _.status);
                            if (_.status == 404) this.WarnNotFound('Duplicating');
                        }
                        else
                        {
                            NotificationLog.Log(`Duplicated '${this.item_info.name}'`, '#0f0');
                            this.explorer.Navigate(this.explorer.relative_path_current);
                            LongOps.Stop(longop);
                        }
                    }
                );
            },
            _ => { NotificationLog.Log(`Cancelled ${this.item_type} Duplicate`, '#fa0'); },

            'Duplicate ' + this.item_type + '?'
        );
    }

    CreateItemButtons(buttons = [])
    {
        if (!buttons || buttons.length < 1) return;

        this.e_btn_root = addElement(this.e_root, 'div', '', '', _ => _.classList.add('file-explorer-item-buttons-root'));
        this.e_btn_root.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); });
        for (let bid in buttons)
        {
            let button = buttons[bid];
            let e_btn = addElement(
                this.e_btn_root, 'div', 'file-explorer-item-button', null,
                _ =>
                {
                    _.addEventListener(
                        'click',
                        button.click_action
                    );

                    addElement(
                        _, 'i', 'material-symbols', null,
                        _ => { _.innerText = button.icon ?? 'help'; }
                    );
                }
            );
            MegaTips.RegisterSimple(e_btn, button.label);
        }
    }

    RefreshElements()
    {
        //let root_rect = this.e_root.getBoundingClientRect();
        const hide_col = _ => { if (_) { _.style.width = '0px'; _.style.padding = '0px'; _.style.opacity = '0%'; } };
        const show_col = _ => { if (_) { _.style.width = '5rem'; _.style.padding = '0px var(--gap-1) 0px var(--gap-1)'; _.style.opacity = '60%'; } };

        if (this.explorer.expanded === true)
        {
            show_col(this.e_info_editor);
            show_col(this.e_info_timestamp);
            show_col(this.e_info_size);
            if (this.e_info_type) this.e_info_type.style.width = '4rem';
        }
        else
        {
            hide_col(this.e_info_editor);
            hide_col(this.e_info_timestamp);
            hide_col(this.e_info_size);
            if (this.e_info_type) this.e_info_type.style.width = 'unset';
        }
    }

    CreateFileElements()
    {
        const style_info_label = 'align-content:center; text-align:right; font-size:0.6rem; opacity:60%; pointer-events:none; text-overflow:ellipsis; overflow:hidden; flex-shrink:0.0;'
            + 'padding-left:0; padding-right:0;' + getTransitionStyle('opacity, width, padding', '--trans-dur-off-slow', 'ease');

        this.e_root.classList.add('file-explorer-file');
        //this.e_root.title = this.item_info.name;

        this.e_info_editor = addElement(this.e_root, 'div', '', style_info_label + 'flex-grow:1.0;', this.item_info.lastModifiedBy.user.displayName);
        this.e_info_timestamp = addElement(this.e_root, 'div', '', style_info_label, new Date(this.item_info.lastModifiedDateTime).toLocaleDateString());

        let size_info = get_file_size_group(this.item_info.size);
        this.e_info_size = addElement(this.e_root, 'div', '', style_info_label, size_info.bytes_label);
        this.AddTooltip('SIZE', size_info.bytes_label);

        window.setTimeout(
            () =>
            {
                setTransitionStyle(this.e_info_timestamp, 'width, opacity', '--trans-dur-off-fast');
                setTransitionStyle(this.e_info_size, 'width, opacity', '--trans-dur-off-fast');
            }, 30
        );

        this.e_info_type = addElement(
            this.e_root, 'div', 'file-explorer-item-info', 'min-width:4rem;',
            _ =>
            {
                addElement(
                    _, 'span', null, 'padding:var(--gap-05); border-radius:var(--gap-05);',
                    _ =>
                    {
                        if (this.item_type_info)
                        {
                            _.innerText = this.item_type_info.label;
                            _.style.backgroundColor = 'hsl(from ' + this.item_type_info.color + ' h calc(s * 0.5) 25%)';
                            _.style.borderColor = 'hsl(from ' + this.item_type_info.color + ' h calc(s * 0.5) 35%)';
                        }
                        else
                            _.innerText = 'file';
                    }
                );
            }
        );

        if (this.item_type_info) MegaTips.RegisterSimple(this.e_info_type, `(((${this.item_type_info.description})))`);
        else MegaTips.RegisterSimple(this.e_info_type, '(((Information for this file type is not currently available.)))');

        this.CreateItemButtons(
            [
                {
                    label: '(((More Options)))',
                    icon: 'more_horiz',
                    click_action: e => this.ShowFileOptions()
                }
            ]
        );

        if (this.e_checkbox)
        {
            this.e_root.addEventListener(
                'click',
                e => 
                {
                    if (e.button === 0)
                    {
                        if (e.detail === 2) window.open(this.item_info.webUrl, '_blank');
                        this.ToggleSelected(e);
                    }
                }
            );
            this.e_root.addEventListener(
                'auxclick',
                e => 
                {
                    if (e.button === 1)
                    {
                        this.ShowFileOptions();
                    }
                }
            );
            this.e_checkbox.addEventListener('click', e => this.ToggleSelected(e));
        }
        else
        {
            this.e_root.addEventListener(
                'click',
                e =>
                {
                    if (e.button === 0 && e.detail > 1) window.open(this.item_info.webUrl, '_blank');
                }
            );
        }
    }

    ShowFileOptions()
    {
        let option_infos = [];

        if (this.item_type_info && this.item_type_info.viewable === true)
        {
            option_infos.push(
                {
                    label: 'View File Online',
                    color: '#0af',
                    on_click: overlay =>
                    {
                        window.open(this.item_info.webUrl, '_blank');
                        overlay.Remove();
                    }
                }
            );
        }

        option_infos.push(
            {
                label: 'Download File',
                color: '#0af',
                on_click: overlay =>
                {
                    if (this.explorer.loading_items === true) return;
                    this.explorer.DownloadFile(this.item_info['@microsoft.graph.downloadUrl']);
                    overlay.Remove();
                }
            }
        );

        option_infos.push(
            {
                label: 'Rename File',
                color: '#0af',
                on_click: overlay =>
                {
                    this.RequestRename();
                    overlay.Remove();
                }
            }
        );

        option_infos.push(
            {
                label: 'Duplicate File',
                color: '#0ff',
                on_click: overlay =>
                {
                    this.RequestCopy();
                    overlay.Remove();
                }
            }
        );

        option_infos.push(
            {
                label: 'Copy File Name',
                color: '#0df',
                on_click: overlay =>
                {
                    NotificationLog.Log('Copied File Name', '#8ff');
                    navigator.clipboard.writeText(this.item_info.name);
                    //overlay.Remove();
                }
            }
        );

        option_infos.push(
            {
                label: 'Copy File Path',
                color: '#0df',
                on_click: overlay =>
                {
                    NotificationLog.Log('Copied File Path', '#8ff');
                    navigator.clipboard.writeText('/' + this.explorer.relative_path_current + '/' + this.item_info.name);
                    //overlay.Remove();
                }
            }
        );

        option_infos.push(
            {
                label: 'Delete File',
                color: '#f40',
                on_click: overlay =>
                {
                    OverlayManager.ShowConfirmDialog(
                        _ =>
                        {
                            const min_byte_size_warning = 10240;
                            if (this.item_info.size < min_byte_size_warning)
                            {
                                this.explorer.OnStartLoading();
                                this.RequestDelete();
                            }
                            else 
                            {
                                OverlayManager.ShowConfirmDialog(
                                    _ => this.RequestDelete(),
                                    _ => { NotificationLog.Log('Cancelled file deletion', '#fa0'); },
                                    'This file contains ((' + get_file_size_group(this.item_info.size).bytes_label + ')) of data.',
                                    'CONFIRM - DELETE FILE',
                                    'CANCEL'
                                );
                            }
                        },
                        _ => { NotificationLog.Log('Cancelled file deletion', '#fa0') },
                        'Are you sure you want to delete the file: ((' + this.item_info.name + '))?',
                        'YES',
                        'NO'
                    );
                    overlay.Remove();
                }
            }
        );

        OverlayManager.ShowChoiceDialog('File Options: ((' + this.item_info.name + '))', option_infos);
    }

    CreateFolderElements()
    {
        this.e_root.classList.add('file-explorer-folder');
        //this.e_root.title = "Open Folder:\n" + this.item_info.name;

        if ('childCount' in this.item_info.folder) 
        {
            let any_children = this.item_info.folder.childCount > 0;
            addElement(
                this.e_root, 'span', 'file-explorer-item-info', null,
                _ =>
                {
                    if (any_children === true) { _.innerText = this.item_info.folder.childCount + ' items'; }
                    else { _.innerText = 'empty'; _.style.color = '#fa0'; }
                }
            );
        }
        else _.style.setProperty('--theme-color', '#fa47');

        this.e_root.addEventListener(
            'click',
            _ =>
            {
                if (_.button !== 0) return;
                if (this.loading_items === true) return;
                const rgx_get_rel_path = /(https?:\/\/[\w\.]+\.com)\/sites\/([^\/]+)\/([^\/]+)\/(.+)/;
                let rgxmatch = decodeURIComponent(this.item_info.webUrl).match(rgx_get_rel_path);
                if (rgxmatch) this.explorer.Navigate(rgxmatch[4]);
                else this.explorer.Navigate(this.item_info.webUrl);
            }
        );

        this.e_root.addEventListener(
            'auxclick',
            e => 
            {
                if (e.button === 1)
                {
                    this.ShowFolderOptions();
                }
            }
        );

        let buttons = [];
        buttons.push(
            {
                label: '(((More Options)))',
                icon: 'more_horiz',
                click_action: e =>
                {
                    this.ShowFolderOptions();
                }
            }
        );
        this.CreateItemButtons(buttons);

        if (this.e_checkbox) this.e_checkbox.addEventListener('click', e => this.ToggleSelected(e));
    }

    ShowFolderOptions()
    {
        OverlayManager.ShowChoiceDialog(
            'Folder Options: ((' + this.item_info.name + '))',
            [
                {
                    label: 'Rename Folder',
                    color: '#0af',
                    on_click: overlay =>
                    {
                        this.RequestRename();
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
                        //overlay.Remove();
                    }
                },
                {
                    label: 'Copy Folder Path',
                    color: '#0fa',
                    on_click: overlay =>
                    {
                        NotificationLog.Log('Copied File Path', '#8ff');
                        navigator.clipboard.writeText('/' + this.explorer.relative_path_current + '/' + this.item_info.name);
                        //overlay.Remove();
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
                                const min_byte_size_warning = 1024;
                                if (this.item_info.size < min_byte_size_warning)
                                {
                                    this.RequestDelete();
                                }
                                else 
                                {
                                    OverlayManager.ShowChoiceDialog(
                                        'Folders must be empty before they can be deleted.',
                                        [
                                            {
                                                label: 'GOT IT',
                                                on_click: _ =>
                                                {
                                                    NotificationLog.Log('Could not delete folder: Must be empty', '#fa0');
                                                    OverlayManager.DismissOne();
                                                },
                                                color: '#0f0'
                                            }
                                        ],
                                        _ =>
                                        {
                                            NotificationLog.Log('Cancelled folder deletion', '#fa0');
                                            //OverlayManager.DismissOne();
                                        }
                                    );
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

class FileSelection extends SelectionInstance
{
    get_item_identifier = item => item.id;
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
    allow_multiselect = true;

    info_width_minimum = 500;

    current_items = [];

    selection = new FileSelection();

    on_load_start = () => { };
    on_load_stop = () => { };

    constructor(e_parent, site_name = '', drive_name = '')
    {
        super(e_parent);
        if (typeof site_name === 'string' && site_name.length > 0) this.site_name = site_name;
        if (typeof drive_name === 'string' && drive_name.length > 0) this.drive_name = drive_name;

        this.selection.addEventListener(
            'firstadded',
            () =>
            {
                this.EnableMultiselectActions();
                if (this.show_folder_actions !== true) return;
                let btn_elements = [this.e_btn_selection_move, this.e_btn_selection_download, this.e_btn_selection_delete];
                DOMHighlight.Elements(btn_elements, 'var(--gap-025)', 20);
            }
        );
        this.selection.addEventListener('allremoved', () => { this.DisableMultiselectActions(); });
        this.selection.addEventListener('change', () => { this.AfterSelectionChange(); });
    }

    OnCreateElements()
    {
        this.relative_base_path = '';
        this.relative_path_current = '';

        this.loading_items = false;

        this.e_root = CreatePagePanel(this.e_parent, false, false, null, _ => _.classList.add('file-explorer-root'));
        this.e_root.tabIndex = '0';

        //this.load_blocker = addElement(this.e_root, 'div', null, null, _ => _.classList.add('file-explorer-load-blocker'));

        this.trench_actions = new Trench(this.e_root, true);
        setTransitionStyle(this.trench_actions.e_root, 'height, min-height', '--trans-dur-off-fast');
        this.e_btn_createfolder = this.trench_actions.AddIconButton('create_new_folder', _ => { this.RequestCreateFolder(); }, 'Create a folder here.', '#c09f6d');
        this.e_btn_uploadfile = this.trench_actions.AddIconButton('upload', _ => { this.RequestUploadFile(); }, 'Upload one or more files here.', '#0cf');

        this.trench_actions.AddFlexibleSpace();
        this.e_btn_selection_move = this.trench_actions.AddIconButton('drive_file_move', _ => { this.RequestMoveSelected(); }, 'Move the selected item(s) to another location.', '#fd0');
        this.e_btn_selection_download = this.trench_actions.AddIconButton('download', _ => { this.RequestDownloadSelected(); }, 'Download the selected item(s).', '#0fc');
        this.e_btn_selection_delete = this.trench_actions.AddIconButton('delete', _ => { this.RequestDeleteSelected(); }, 'Delete the selected item(s).', '#f44');

        this.e_btn_selection_move.setAttribute('coming-soon', '');
        this.e_btn_selection_download.setAttribute('coming-soon', '');
        this.DisableMultiselectActions();

        this.e_items_root = CreatePagePanel(this.e_root, true, false, null, _ => { _.classList.add('file-explorer-items-root'); });
        this.header_row = new FileExplorerHeaderRow(this);
        this.header_row.CreateElements();
        this.e_items_container = addElement(this.e_items_root, 'div', 'file-explorer-items-container scroll-y', _ => { });

        this.e_items_root.addEventListener('dragover', e => e.preventDefault());
        this.e_items_root.addEventListener('dragenter', e => this.onDragEnter(e));
        this.e_items_root.addEventListener('dragleave', e => this.onDragLeave(e));
        this.e_items_root.addEventListener('drop', e => this.onDrop(e));

        if (this.autonavigate === true) this.NavigateAfter(this.base_relative_path ?? '', 130);
    }

    onDragEnter(event)
    {
        event.preventDefault();
        event.stopPropagation();

        this.e_items_root.classList.remove('file-drop-zone');
        this.e_items_root.classList.add('file-drop-zone');
    }
    onDragLeave(event)
    {
        event.preventDefault();
        event.stopPropagation();
        this.e_items_root.classList.remove('file-drop-zone');
    }

    onDrop(event)
    {
        const get_last_path_part = path =>
        {
            let parts = path.split('/');
            if (parts && parts.length > 0) return parts[parts.length - 1];
            return path;
        };

        event.preventDefault();
        event.stopPropagation();

        this.e_items_root.classList.remove('file-drop-zone');

        if (event.dataTransfer.files)
        {
            OverlayManager.ShowFileUploadDialog(
                'Uploading Files to ((/' + get_last_path_part(this.relative_path_current) + '))'
                + '<br><span style="font-size:0.65rem; opacity:50%; padding-left:1rem; padding-right:1rem;">WARNING: ((Uploading multiple large files at the same time can cause your browser to freeze or crash.))</span>',
                files => { this.UploadFilesAtCurrentPath(files); },
                () => { NotificationLog.Log('Cancelled Uploading File(s)', '#f86'); },
                count => { return 'SUBMIT ' + count + ' FILES'; },
                event.dataTransfer.files
            );
        }
    }

    OnRefreshElements(expanded = false)
    {
        this.expanded = expanded;
        this.RefreshColumnVisibility();
        this.RefreshActionElements();
    }

    OnRemoveElements() { this.e_root.remove(); }

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
            MegaTips.Register(this.e_path_back, _ => { _.innerHTML = MegaTips.FormatHTML('Back to (((' + (this.drive_name + '/' + this.relative_path_current).split('/').filter(_ => _.length > 0).slice(0, -1).join('/') + ')))'); });

            this.e_path_label = addElement(this.e_path_root, 'div', 'file-explorer-nav-path');

            addElement(this.e_path_root, 'div', undefined, 'min-width:0; flex-grow:1.0; flex-shrink:1.0;');
            this.e_btn_path_copy = add_button(
                this.e_path_root, 'COPY', '', 'content_copy', undefined,
                e =>
                {
                    navigator.clipboard.writeText(this.e_path_label.innerText);
                    NotificationLog.Log('Copied text to clipboard.');
                }
            );
            MegaTips.RegisterSimple(this.e_btn_path_copy, 'Copy the current path');

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

    ShowActionBar()
    {
        this.trench_actions.e_root.style.minHeight = '2rem';
        this.trench_actions.e_root.style.height = '2rem';
        this.trench_actions.e_root.style.padding = 'var(--gap-025)';
    }

    HideActionBar()
    {
        this.trench_actions.e_root.style.minHeight = '0px';
        this.trench_actions.e_root.style.height = '0px';
        this.trench_actions.e_root.style.padding = '0px';
    }

    EnableMultiselectActions()
    {
        this.e_btn_selection_move.removeAttribute('disabled');
        this.e_btn_selection_download.removeAttribute('disabled');
        this.e_btn_selection_delete.removeAttribute('disabled');
    }
    DisableMultiselectActions()
    {
        this.e_btn_selection_move.setAttribute('disabled', '');
        this.e_btn_selection_download.setAttribute('disabled', '');
        this.e_btn_selection_delete.setAttribute('disabled', '');
    }

    RefreshActionElements()
    {
        if (this.show_folder_actions === true) this.ShowActionBar();
        else this.HideActionBar();
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
                    _.classList.add('file-explorer-nav-bar');

                    add_button(
                        _, 'CREATE FOLDER', 'Create a new folder within the current folder.', 'create_new_folder', '#c09f6d',
                        _ => { this.RequestCreateFolder(); }
                    );

                    add_button(
                        _, 'UPLOAD FILE', 'Upload one or more files to the current folder.', 'upload', '#4ef',
                        _ => { this.RequestUploadFile(); }
                    );
                }
            );
            setSiblingIndex(this.e_folder_actions_root, 1);
        }
        else
        {
            if (this.e_folder_actions_root) this.e_folder_actions_root.remove();
            this.e_folder_actions_root = undefined;
        }
    }

    RefreshColumnVisibility()
    {
        if (this.current_items && this.current_items.length > 0)
            for (let id in this.current_items) this.current_items[id].RefreshElements();
    }


    GetSelectionIndex(item) { return this.selection.indexOf(item); }
    DeselectItem(item) { return this.selection.remove(item.item_info); }
    SelectItem(item) { return this.selection.add(item.item_info); }
    ToggleSelectedItem(item) { this.selection.toggle(item.item_info); }
    ClearSelected() { return this.selection.clear(); }

    AfterSelectionChange()
    {
        this.RefreshActionElements();
        this.current_items.forEach(_ => { _.RefreshSelected(); });
    }

    RequestMoveSelected() { }
    RequestDownloadSelected() { }

    RequestDeleteSelected()
    {
        if (this.selection.any_selected === false) return;

        OverlayManager.ShowConfirmDialog(
            _ =>
            {
                let op_instances = this.selection.items.map(_ => new ItemDeleteInstance(_, this.drive_id, this.relative_path_current));
                this.OnStartLoading();
                Promise.allSettled(
                    op_instances.map(_ => _['Process']())
                ).then(
                    _ =>
                    {
                        this.Navigate(this.relative_path_current);
                        this.ClearSelected();
                        NotificationLog.Log(`Done deleting ${op_instances.length} items`, '#0f0');
                    }
                );
            },
            _ =>
            {

            },
            'Delete the selected files?',
            'DELETE ALL', 'CANCEL'
        )


    }

    async CreateFolderInRelativePath(name)
    {
        if (this.drive_id_valid !== true) return undefined;
        const longop = LongOps.Start('driveitem-create-folder' + name, { label: name, icon: 'create_new_folder', verb: 'Created folder' });
        let url = window.SharePoint.url_api + `/drives/${this.drive_id}/root:/${this.relative_path_current}:/children`;
        let data = { name: name, folder: {} };
        data['@microsoft.graph.conflictBehavior'] = 'rename';
        let result = await window.SharePoint.SetData(url, data, 'post');
        LongOps.Stop(longop);
        return result;
    }

    async CreateFileInRelativePath(name, file_content)
    {
        if (this.drive_id_valid !== true) return undefined;
        const longop = LongOps.Start('driveitem-upload-file' + name, { label: name, icon: 'upload', verb: 'Uploaded file' });
        let url = window.SharePoint.url_api + `/drives/${this.drive_id}/root:/${this.relative_path_current}/${name}:/content`;
        let result = await window.SharePoint.SetData(url, file_content, 'put', 'text/plain');
        LongOps.Stop(longop);
        return result;
    }

    RequestCreateFolder()
    {
        OverlayManager.ShowStringDialog(
            'New Folder Name', '',
            folder_name =>
            {
                folder_name = folder_name.trim();
                if (folder_name.length > 0)
                {
                    this.OnStartLoading();
                    this.CreateFolderInRelativePath(folder_name).then(
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

    static async ReadFileContents(file_ref) { return await new Response(file_ref).arrayBuffer(); }


    UploadFilesAtCurrentPath(files = [])
    {
        if (!files || files.length < 1) return;

        this.OnStartLoading();

        let uploads = [];

        let fid = 0;
        while (fid < files.length)
        {
            const file = files.item(fid);
            fid++;
            if (file.size > (150 * bytes_mb)) continue;
            uploads.push(new FileUploadInstance(file, this.drive_id, this.relative_path_current));
        }

        if (uploads.length < 1)
        {
            this.OnStopLoading();
            return;
        }

        Promise.allSettled(
            uploads.map(u => u['Process']())
        ).then(
            _ =>
            {
                NotificationLog.Log('Done Uploading File(s)', '#0f0');
                this.Navigate(this.relative_path_current);
            }
        ).catch(_ => { NotificationLog.Log('Error While Uploading File(s)', '#f00'); });
    }

    RequestUploadFile()
    {
        const get_last_path_part = path =>
        {
            let parts = path.split('/');
            if (parts && parts.length > 0) return parts[parts.length - 1];
            return path;
        };

        OverlayManager.ShowFileUploadDialog(
            'Uploading Files to ((/' + get_last_path_part(this.relative_path_current) + '))'
            + '<br><span style="font-size:0.65rem; opacity:50%; padding-left:1rem; padding-right:1rem;">WARNING: ((Uploading multiple large files at the same time can cause your browser to freeze or crash.))</span>',
            files => { this.UploadFilesAtCurrentPath(files); },
            () => { NotificationLog.Log('Cancelled Uploading File(s)', '#f86'); }
        );
    }

    OnStartLoading()
    {
        MarkElementLoading(this.e_items_root);
        this.loading_items = true;
        //this.load_blocker.style.opacity = '100%';
        //this.load_blocker.style.pointerEvents = 'all';
        if (this.on_load_start) this.on_load_start();
    }

    OnStopLoading()
    {
        this.loading_items = false;
        //this.load_blocker.style.opacity = '0%';
        //this.load_blocker.style.pointerEvents = 'none';
        if (this.on_load_stop) this.on_load_stop();
        ClearElementLoading(this.e_items_root);
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

        if (this.maintain_selection !== true) this.ClearSelected();

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
            //this.e_path_back.title = 'Navigate back to ' + parent_name;
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
        //this.CreateFolderActionElements();
        this.RefreshActionElements();

        if (!items) 
        {
            this.ShowFolderMessage('Invalid items provided! You should never see this!');
            return;
        }

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

        if (this.current_items && this.current_items.length > 0)
        {
            for (let ii in this.current_items) this.current_items[ii].RemoveElements();
        }
        this.current_items = [];

        for (let id in items)
        {
            let item_instance = new FileExplorerItem(this, items[id]);
            item_instance.CreateElements(this.e_items_container);
            this.current_items.push(item_instance);
        }
    }

    async ValidateSiteId()
    {
        this.site_id_valid = typeof this.site_id === 'string' && this.site_id.length > 0;
        if (this.site_id_valid === true) return;
        if (typeof this.site_name !== 'string' || this.site_name.length < 1) return;
        let site_info = await window.SharePoint.GetData(window.SharePoint.url_api + `/sites/${window.SharePoint.web_name}:/sites/${this.site_name}`);
        if ('id' in site_info) this.site_id = site_info.id;
        this.site_id_valid = typeof this.site_id === 'string' && this.site_id.length > 0;
    }

    async ValidateDriveId()
    {
        await this.ValidateSiteId(this.site_name);
        if (this.site_id_valid !== true) return;

        this.drive_id_valid = typeof this.drive_id === 'string' && this.drive_id.length > 0;
        if (this.drive_id_valid === true) return;

        let drives = (await window.SharePoint.GetData(window.SharePoint.url_api + `/sites/${this.site_id}/drives`)).value;
        this.drive_id = drives.filter(_ => _.name === this.drive_name)[0].id;
        this.drive_id_valid = typeof this.drive_id === 'string' && this.drive_id.length > 0;
    }

    async FetchRootFolderId()
    {
        await this.ValidateDriveId(this.site_name);
        return (await window.SharePoint.GetData(window.SharePoint.url_api + `/drives/${this.drive_id}/root/children`)).value;
    }

    async FetchFolderItems()
    {
        if (typeof this.relative_path_current === 'string' && this.relative_path_current.length > 0)
        {
            let relative_path_encoded = encodeURIComponent(this.relative_path_current);
            await this.ValidateDriveId();
            const fields = 'id,name,file,folder,size,createdBy,createdDateTime,lastModifiedBy,lastModifiedDateTime,webUrl,parentReference,@microsoft.graph.downloadUrl';
            let resp = await window.SharePoint.GetData(window.SharePoint.url_api + `/drives/${this.drive_id}/root:/${relative_path_encoded}:/children?select=${fields}`);
            if (resp && resp.value) return resp.value;
            return resp;
        }
        else 
        {
            await this.ValidateDriveId();
            let resp = await window.SharePoint.GetData(window.SharePoint.url_api + `/drives/${this.drive_id}/root/children`);
            if (resp && resp.value) return resp.value;
            return resp;
        }
    }
}


Modules.Report('File Explorers', 'This module adds a reusable remote file explorer.');