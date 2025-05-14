import { Modules } from "../modules.js";
import { DebugLog } from "../debuglog.js";
import { addElement, CreatePagePanel } from "../utils/domutils.js";

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
        this.e_root.addEventListener('click', _ => { _.stopPropagation(); _.preventDefault(); });
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
                if (document.activeElement == null || document.activeElement == document.body || document.activeElement == document.documentElement)
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
        if (OverlayManager.GetOverlayIndex(overlay) < 0) OverlayManager.overlays.push(overlay);
        overlay.Create();
    }

    static Hide(overlay = Overlay.Nothing)
    {
        let existing_id = OverlayManager.overlays.indexOf(overlay);
        if (existing_id < 0) return;
        OverlayManager.overlays[existing_id].Remove();
        OverlayManager.overlays.splice(existing_id, 1);
    }

    static DismissOne()
    {
        let next_id = OverlayManager.overlays.findIndex(_ => _.dismissable === true);
        if (next_id > -1)
        {
            let next_dismissable = OverlayManager.overlays.splice(next_id, 1)[0];
            next_dismissable.Remove();
        }
    }

    static HideAll(dismissable_only = false)
    {
        if (dismissable_only)
        {
            let dismissables = OverlayManager.overlays.filter(_ => _.dismissable === true);
            OverlayManager.overlays = OverlayManager.overlays.filter(_ => _.dismissable !== true);
            dismissables.forEach((x, i, a) => x.Remove());
        }
        else
        {
            OverlayManager.overlays.forEach((x, i, a) => x.Remove());
            OverlayManager.overlays = [];
        }

        OverlayManager.RefreshVisibility();
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
                e_body, true, false, 'flex-grow:1.0; display:flex; flex-direction:column; flex-wrap:nowrap;',
                _ =>
                {
                    for (let cid in choices)
                    {
                        let choice = choices[cid];
                        if (!choice) continue;

                        if (choice.color.length < 1) choice.color = '#fff';
                        CreatePagePanel(
                            _, false, false, style_parts + '--theme-color:' + choice.color + '; padding:var(--gap-1);',
                            _ =>
                            {
                                _.innerHTML = choice.label;
                                _.title = choice.label;
                                _.classList.add('panel-button');
                                _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                                if (choice.on_click)
                                    _.addEventListener(
                                        'click',
                                        e =>
                                        {
                                            o.submitted = true;
                                            choice.on_click(o);
                                        }
                                    );
                            }
                        );
                    }
                }
            );
        };
        OverlayManager.overlays.push(o);
        o.Create();
        return o;
    }

    static ShowStringDialog(prompt = 'Enter Text', default_value = 'New Text', on_submit = text => { }, on_cancel = () => { })
    {
        let o = new Overlay('input-string', _ => { }, _ =>
        {
            if (o.submitted !== true) on_cancel();
            else on_submit(o.e_input_txt.value);
        });
        o.original_value = default_value;
        o.submitted = false;
        o.dismissable = true;
        o.createOverlay = _ =>
        {
            const style_overlay_root = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
                + 'min-height:3rem; min-width:28rem; max-width:calc(100% - 1rem);'
                + 'display:flex; flex-direction:column; flex-wrap:nowrap;';
            const style_parts = 'flex-grow:1.0; align-content:center; text-align:center; font-size:0.85rem; letter-spacing:2px; padding:var(--gap-1);';

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
        o.Create();
        o.e_input_txt.focus();
        return o;
    }
}

OverlayManager.TryFindRootElement();
OverlayManager.RefreshVisibility();


Modules.Report('Overlays', 'This module provides a reusable code component for screen overlays such as confirmation dialogs.');