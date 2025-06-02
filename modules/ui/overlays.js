import { Modules } from "../modules.js";
import { DebugLog } from "../debuglog.js";
import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { bytes_mb, get_file_size_group } from "../utils/filesizes.js";
import { NotificationLog } from "../notificationlog.js";


export class Overlay
{
    static Nothing = new Overlay();

    e_root = {};

    created = false;
    dismissable = false; // can be dismissed by clicking outside the popup

    createOverlay = _ => { };
    removeOverlay = _ => { };

    handleHotkeys = _ => { };

    constructor(kind = '', createOverlay = _ => { }, removeOverlay = _ => { })
    {
        this.kind = kind;
        this.createOverlay = createOverlay;
        this.removeOverlay = removeOverlay;
    }

    Create()
    {
        if (this.created) return;

        if (!OverlayManager.created_root) OverlayManager.TryFindRootElement();
        if (!OverlayManager.created_root) { DebugLog.Log('NO OVERLAY ROOT CREATED'); return; }

        document.activeElement.blur();

        this.e_root = addElement(OverlayManager.e_overlays_root, 'div', 'overlay-root', '', _ => { });
        this.e_root.title = '';

        //this.e_root.addEventListener('click', _ => { _.stopPropagation(); _.preventDefault(); });
        if (this.createOverlay) this.createOverlay(this);
        this.created = true;

        OverlayManager.RefreshVisibility();
    }

    Remove()
    {
        if (!this.created) return;
        this.created = false;

        if (this.removeOverlay) this.removeOverlay(this);
        this.e_root.remove();

        let existing_id = OverlayManager.GetOverlayIndex(this);
        if (existing_id > -1) OverlayManager.overlays.splice(existing_id, 1);

        OverlayManager.RefreshVisibility();
    }
}

export class OverlayManager
{
    static created_root = false;
    static visible = false;
    static e_overlays_root = {};
    static overlays = [];

    static OkayChoice = (beforeRemove = _ => { }) => { return { label: 'OKAY', on_click: _ => { beforeRemove(); _.Remove(); }, color: '#dfe' }; };

    static TryFindRootElement()
    {
        if (OverlayManager.created_root) return;
        OverlayManager.e_overlays_root = addElement(document.body, 'div', 'overlays-root', '', _ => { _.id = 'overlays-root'; });
        OverlayManager.e_overlays_root.title = 'Click to dismiss popup';
        OverlayManager.e_overlays_root.addEventListener(
            'mousedown',
            _ =>
            {
                let root_focus = document.activeElement == null || document.activeElement == document.body || document.activeElement == document.documentElement;
                let important_current = OverlayManager.current_overlay && OverlayManager.current_overlay.important === true;
                if (important_current === true && root_focus !== true)
                {
                    NotificationLog.Log('Click again to cancel.');
                    return;
                }
                OverlayManager.DismissOne();
            }
        );
        OverlayManager.created_root = true;
    }

    static RefreshVisibility()
    {
        if (!OverlayManager.e_overlays_root) return;

        if (OverlayManager.overlays.length > 0)
        {
            OverlayManager.visible = true;
            OverlayManager.e_overlays_root.style.opacity = '100%';
            OverlayManager.e_overlays_root.style.pointerEvents = 'all';
        }
        else
        {
            OverlayManager.visible = false;
            OverlayManager.e_overlays_root.style.opacity = '0%';
            OverlayManager.e_overlays_root.style.pointerEvents = 'none';
        }
    }

    static GetOverlayIndex(overlay = Overlay.Nothing)
    {
        let existing_id = OverlayManager.overlays.indexOf(overlay);
        return existing_id;
    }

    static Show(overlay = Overlay.Nothing)
    {
        overlay.Create();
        if (OverlayManager.GetOverlayIndex(overlay) < 0) OverlayManager.overlays.push(overlay);
        OverlayManager.#SetCurrentOverlay();
    }

    static Hide(overlay = Overlay.Nothing)
    {
        let existing_id = OverlayManager.overlays.indexOf(overlay);
        if (existing_id < 0) return;
        OverlayManager.overlays[existing_id].Remove();
        OverlayManager.overlays.splice(existing_id, 1);
        OverlayManager.#SetCurrentOverlay();
    }

    static DismissOne()
    {
        let next_id = OverlayManager.overlays.findIndex(_ => _.dismissable === true);
        if (next_id > -1)
        {
            let next_dismissable = OverlayManager.overlays.splice(next_id, 1)[0];
            next_dismissable.Remove();
        }
        OverlayManager.#SetCurrentOverlay();
    }

    static HideAll(dismissable_only = false)
    {
        if (dismissable_only)
        {
            let dismissables = OverlayManager.overlays.filter(_ => _.dismissable === true);
            OverlayManager.overlays = OverlayManager.overlays.filter(_ => _.dismissable !== true);
            dismissables.forEach(x => x.Remove());
            OverlayManager.#SetCurrentOverlay();
        }
        else
        {
            OverlayManager.overlays.forEach(x => x.Remove());
            OverlayManager.overlays = [];
            OverlayManager.#SetCurrentOverlay();
        }

        OverlayManager.RefreshVisibility();
    }

    static #SetCurrentOverlay()
    {
        OverlayManager.current_overlay = OverlayManager.overlays.length > 0 ? OverlayManager.overlays[OverlayManager.overlays.length - 1] : undefined;
    }

    // adds y / n hotkeys
    static ShowConfirmDialog(on_confirm = _ => { }, on_deny = _ => { }, prompt = 'Are you sure?', label_confirm = 'YES', label_deny = 'NO')
    {
        let o = OverlayManager.ShowChoiceDialog(
            prompt,
            [
                { label: label_confirm, on_click: _ => { on_confirm(); _.Remove(); }, color: '#dfe' },
                { label: label_deny, on_click: _ => { on_deny(); _.Remove(); }, color: '#fed' }
            ]
        );
        o.handleHotkeys = e =>
        {
            if (e.key === 'y') { on_confirm(o); o.Remove(); }
            else if (e.key === 'n') { on_deny(o); o.Remove(); }
            else if (e.key === 'Enter') { on_confirm(o); o.Remove(); }
            else if (e.key === 'Escape') { on_deny(o); o.Remove(); }
        };
        return o;
    }

    static ShowChoiceDialog(prompt = 'Are you sure?', choices = [{ label: 'YES', on_click: _ => { }, color: '#fff' }], on_cancel = () => { })
    {
        let o = new Overlay(
            'choice', _ => { },
            _ =>
            {
                if (o.submitted !== true) on_cancel();
            }
        );
        o.dismissable = true;
        o.submitted = false;

        prompt = prompt.replace('((', '<span style="color:white;">');
        prompt = prompt.replace('))', '</span>');
        o.createOverlay = _ =>
        {
            const style_overlay_root = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
                + 'min-height:3rem; min-width:28rem; max-width:calc(100% - 1rem);'
                + 'display:flex; flex-direction:column; flex-wrap:nowrap;';
            const style_parts = 'flex-grow:1.0; flex-shrink:0.0; align-content:center; text-align:center; font-size:0.85rem; letter-spacing:2px; padding:var(--gap-1);';

            let e_body = CreatePagePanel(_.e_root, false, false, style_overlay_root, _ => { });
            e_body.tabIndex = 0;
            e_body.focus();
            e_body.addEventListener('mousedown', e => { e.stopPropagation(); e_body.focus(); });

            CreatePagePanel(e_body, true, false, style_parts + 'flex-grow:0.0; color:orange; letter-spacing:0px;', _ => { _.innerHTML = prompt; });
            CreatePagePanel(
                e_body, true, false, 'flex-grow:1.0; display:flex; flex-direction:column; flex-wrap:nowrap; gap:2px;',
                _ =>
                {
                    choices.forEach(
                        (choice, i, a) =>
                        {
                            if (!choice) return;

                            if (choice.color.length < 1) choice.color = '#fff';
                            CreatePagePanel(
                                _, false, false, style_parts + '--theme-color:' + choice.color + '; padding:var(--gap-05);',
                                _ =>
                                {
                                    if (i < 1)
                                    {
                                        _.style.borderBottomLeftRadius = '0';
                                        _.style.borderBottomRightRadius = '0';
                                    }
                                    else if (i >= (a.length - 1))
                                    {
                                        _.style.borderTopLeftRadius = '0';
                                        _.style.borderTopRightRadius = '0';
                                    }
                                    else
                                    {
                                        _.style.borderRadius = '0';
                                    }
                                    _.title = choice.label;
                                    _.innerHTML = choice.label;
                                    _.classList.add('panel-button');
                                    _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                                    if (choice.on_click)
                                    {
                                        _.addEventListener(
                                            'click',
                                            e =>
                                            {
                                                o.submitted = true;
                                                choice.on_click(o);
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    );
                }
            );
        };
        OverlayManager.overlays.push(o);
        OverlayManager.#SetCurrentOverlay();
        o.Create();
        return o;
    }

    static ShowStringDialog(prompt = 'Enter Text', default_value = 'New Text', on_submit = text => { }, on_cancel = () => { })
    {
        let o = new Overlay(
            'input-string',
            _ => { _.important = true; },
            _ =>
            {
                if (o.submitted !== true) on_cancel();
                else on_submit(o.e_input_txt.value);
            }
        );
        o.important = true;
        o.original_value = default_value;
        o.submitted = false;
        o.dismissable = true;

        prompt = prompt.replace('((', '<span style="color:white;">');
        prompt = prompt.replace('))', '</span>');

        o.createOverlay = _ =>
        {
            const style_overlay_root = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
                + 'min-height:3rem; min-width:28rem; max-width:calc(100% - 1rem);'
                + 'display:flex; flex-direction:column; flex-wrap:nowrap;';
            const style_parts = 'flex-grow:1.0; align-content:center; text-align:center; font-size:0.85rem; letter-spacing:2px; padding:var(--gap-1); line-height:1.5rem;';

            let e_body = CreatePagePanel(_.e_root, false, false, style_overlay_root, _ => { });
            e_body.addEventListener('mousedown', e => { e.stopPropagation(); e_body.focus(); });
            e_body.tabIndex = 0;
            e_body.focus();

            CreatePagePanel(e_body, true, false, style_parts + 'flex-grow:0.0; color:orange; letter-spacing:0px;', _ => { _.innerHTML = prompt; });
            CreatePagePanel(
                e_body, true, false, 'flex-grow:1.0; display:flex; flex-direction:column; flex-wrap:nowrap;',
                _ =>
                {
                    o.e_input_txt = addElement(
                        _, 'input', null, null,
                        _ =>
                        {
                            _.type = 'text';
                            _.value = default_value;
                            _.placeholder = 'Enter text...';
                            _.style.flexBasis = '3rem';
                            _.style.padding = 'var(--gap-025)';
                            _.style.paddingLeft = 'calc(var(--gap-1) + 0.5rem)';

                            _.addEventListener('mousedown', e => { e.stopPropagation(); _.focus(); });
                            _.addEventListener(
                                'keyup',
                                e =>
                                {
                                    o.e_btn_submit.classList.remove('panel-button-disabled');
                                    let valtrimmed = _.value.trim();
                                    if (valtrimmed.length < 1) o.e_btn_submit.classList.add('panel-button-disabled');
                                    else if (valtrimmed === o.original_value) o.e_btn_submit.classList.add('panel-button-disabled');
                                }
                            );
                        }
                    );

                    o.e_btn_submit = CreatePagePanel(
                        _, false, false, style_parts + '--theme-color:#4f4; padding:var(--gap-05);',
                        _ =>
                        {
                            _.classList.add('panel-button-disabled');
                            _.title = 'SUBMIT';
                            _.innerText = 'SUBMIT';
                            _.style.flexBasis = '1.5rem';
                            _.classList.add('panel-button');
                            _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                            _.addEventListener('click', e => { o.submitted = true; OverlayManager.DismissOne(); });
                        }
                    );
                }
            );
        };
        OverlayManager.overlays.push(o);
        OverlayManager.#SetCurrentOverlay();
        o.Create();
        o.e_input_txt.focus();
        return o;
    }

    static ShowFileUploadDialog(prompt = 'Select File', on_submit = files => { }, on_cancel = () => { }, upload_prompt = count => { return 'SUBMIT ' + count + ' FILES'; })
    {
        prompt = prompt.replace('((', '<span style="color:white;">');
        prompt = prompt.replace('))', '</span>');

        let o = new Overlay(
            'attach-file',
            _ =>
            {
                const style_overlay_root = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
                    + 'min-height:3rem; min-width:28rem; max-width:calc(100% - 1rem);'
                    + 'display:flex; flex-direction:column; flex-wrap:nowrap;';
                const style_parts = 'flex-grow:1.0; align-content:center; text-align:center; font-size:0.85rem; letter-spacing:2px; padding:var(--gap-1); line-height:1.5rem;';

                let e_body = CreatePagePanel(_.e_root, false, false, style_overlay_root, _ => { });
                e_body.addEventListener('mousedown', e => { e.stopPropagation(); e_body.focus(); });
                e_body.tabIndex = 0;
                e_body.focus();

                o.e_prompt = CreatePagePanel(e_body, true, false, style_parts + 'flex-grow:0.0; color:orange; letter-spacing:0px;', _ => { _.innerHTML = prompt; });
                CreatePagePanel(
                    e_body, true, false, 'flex-grow:1.0; display:flex; flex-direction:column; flex-wrap:nowrap;',
                    _ =>
                    {
                        addElement(
                            _, 'form', null, 'display:none; flex-direction:row; flex-wrap:nowrap;',
                            _ =>
                            {
                                _.action = '';
                                o.input_file = addElement(
                                    _, 'input', null, 'pointer-events:all; flex-grow:1.0; flex-shrink:1.0;',
                                    _ =>
                                    {
                                        _.id = 'input-file-upload';
                                        _.type = 'file';
                                        _.multiple = true;
                                    }
                                );
                                o.input_file.addEventListener(
                                    'change',
                                    e =>
                                    {
                                        o.e_btn_submit.classList.remove('panel-button-disabled');
                                        if (o.input_file.files.length < 1)
                                        {
                                            o.e_btn_submit.classList.add('panel-button-disabled');
                                            o.e_selected.innerHTML = 'NO FILE SELECTED';
                                            o.e_btn_submit.innerText = 'SUBMIT';
                                        }
                                        else
                                        {
                                            o.e_selected.innerHTML = '';
                                            o.valid_count = 0;
                                            let fid = 0;
                                            while (fid < o.input_file.files.length)
                                            {
                                                let file = o.input_file.files.item(fid);
                                                fid++;
                                                if (!file) continue;

                                                if ('name' in file)
                                                {
                                                    let too_big = file.size > (250 * bytes_mb);
                                                    let size_group = get_file_size_group(file.size);
                                                    CreatePagePanel(
                                                        o.e_selected, false, false, 'display:flex; flex-direction:row; text-align:left; flex-shrink:0.0; align-content:center;',
                                                        _ =>
                                                        {
                                                            if (too_big === true) 
                                                            {
                                                                _.style.backgroundColor = 'hsl(from var(--theme-color) 0deg 100% 12%)';
                                                                addElement(
                                                                    _, 'div', 'material-symbols', 'font-size:1rem; align-content:center; text-align:center; color:#f00;',
                                                                    _ => { _.innerText = 'priority_high'; }
                                                                );
                                                                addElement(
                                                                    _, 'div', null, 'font-weight:bold; font-size:0.6rem; align-content:center; text-align:center; background-color:#f003; padding:var(--gap-025);border-radius:var(--gap-025); border:solid 2px red;',
                                                                    _ => { _.innerText = 'TOO BIG'; }
                                                                );
                                                                addElement(
                                                                    _, 'div', null, 'color:orange; font-size:0.75rem; align-content:center; ',
                                                                    _ => { _.innerText = `(${size_group.bytes_label})`; }
                                                                );
                                                                addElement(
                                                                    _, 'div', null, 'align-content:center; ',
                                                                    _ => { _.innerText = file.name; }
                                                                );
                                                            }
                                                            else
                                                            {
                                                                o.valid_count++;
                                                                addElement(
                                                                    _, 'div', 'material-symbols', 'font-size:1rem; align-content:center; text-align:center; color:#0ff;',
                                                                    _ => { _.innerText = 'task_alt'; }
                                                                );
                                                                addElement(
                                                                    _, 'div', null, 'align-content:center; ',
                                                                    _ => { _.innerText = file.name; }
                                                                );
                                                            }

                                                            _.title = file.name;
                                                        }
                                                    );
                                                }
                                            }
                                            o.e_btn_submit.innerText = upload_prompt(o.valid_count);

                                            if (o.valid_count < 1)
                                            {
                                                o.e_btn_submit.classList.add('panel-button-disabled');
                                                o.e_btn_submit.innerText = 'SUBMIT';
                                            }
                                        }
                                    }
                                );
                            }
                        );

                        o.e_selected = addElement(_, 'div', 'scroll-y', 'display:flex; flex-direction:column; text-align:center; align-content:center; padding:var(--gap-05); max-height:50vh; gap:var(--gap-025);', 'NO FILE SELECTED');

                        o.e_btn_attach = CreatePagePanel(
                            _, false, false, style_parts + '--theme-color:#0ff; padding:var(--gap-05);',
                            _ =>
                            {
                                _.title = 'SELECT FILES';
                                _.innerText = 'SELECT FILES';
                                _.style.flexBasis = '1.5rem';
                                _.classList.add('panel-button');
                                _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                                _.addEventListener(
                                    'click',
                                    e =>
                                    {
                                        o.input_file.click();
                                    }
                                );
                            }
                        );

                        o.e_btn_submit = CreatePagePanel(
                            _, false, false, style_parts + '--theme-color:#4f4; padding:var(--gap-05);',
                            _ =>
                            {
                                _.classList.add('panel-button-disabled');
                                _.title = 'SUBMIT';
                                _.innerText = 'SUBMIT';
                                _.style.flexBasis = '1.5rem';
                                _.classList.add('panel-button');
                                _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                                _.addEventListener(
                                    'click',
                                    e =>
                                    {
                                        o.submitted = true;
                                        OverlayManager.DismissOne();
                                    }
                                );
                            }
                        );
                    }
                );
            },
            _ =>
            {
                if (o.submitted !== true) on_cancel();
                else on_submit(o.input_file.files);
            }
        );
        o.important = true;
        o.submitted = false;
        o.dismissable = true;
        OverlayManager.overlays.push(o);
        OverlayManager.#SetCurrentOverlay();
        o.Create();
        return o;
    }
}

OverlayManager.TryFindRootElement();
OverlayManager.RefreshVisibility();


Modules.Report('Overlays', 'This module provides a reusable code component for screen overlays such as confirmation dialogs.');