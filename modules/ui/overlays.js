import { DebugLog } from "../debuglog.js";
import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { Modules } from "../modules.js";

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

        this.e_root = addElement(OverlayManager.e_overlays_root, 'div', 'overlay-root', '', _ => { });
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
        OverlayManager.e_overlays_root.addEventListener('click', _ => { OverlayManager.HideAll(true) });
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

    static HideAll(dismissable_only = false)
    {
        if (dismissable_only)
        {
            let dismissables = OverlayManager.overlays.filter(_ => _.dismissable === true);
            dismissables.forEach((x, i, a) => x.Remove());
            OverlayManager.overlays = OverlayManager.overlays.filter(_ => _.dismissable !== true);
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
                { label: label_deny, on_click: _ => { on_deny(); _.Remove(); }, color: '#fed' },
                { label: label_confirm, on_click: _ => { on_confirm(); _.Remove(); }, color: '#dfe' }
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

    static ShowChoiceDialog(prompt = 'Are you sure?', choices = [{ label: 'YES', on_click: _ => { }, color: '#fff' }])
    {
        let o = new Overlay('choice', _ => { }, _ => { });
        o.dismissable = choices.length < 2;
        o.createOverlay = _ =>
        {
            const style_overlay_root = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
                + 'min-height:8rem; width:min(100% - 1rem, 28rem);'
                + 'display:flex; flex-direction:column; flex-wrap:nowrap;'
                + 'outline:solid 2px orange; outline-offset:4px;';
            const style_parts = 'flex-grow:1.0; align-content:center; text-align:center; font-size:1rem; letter-spacing:2px;';

            let e_body = CreatePagePanel(_.e_root, false, false, style_overlay_root, _ => { });

            CreatePagePanel(e_body, true, false, style_parts + 'color:orange; padding:1.5rem; letter-spacing:0px;', _ => { _.innerHTML = prompt; });
            CreatePagePanel(
                e_body, true, false, 'flex-grow:1.0; display:flex; flex-direction:row; flex-wrap:nowrap;',
                _ =>
                {
                    for (let cid in choices)
                    {
                        let choice = choices[cid];
                        if (!choice) continue;
                        CreatePagePanel(
                            _, false, false, style_parts + '--theme-color:' + choice.color + '; padding:0.5rem;',
                            _ =>
                            {
                                _.innerHTML = choice.label;
                                _.title = choice.label;
                                _.className += ' panel-button';
                                if (choice.on_click) _.addEventListener('click', e => choice.on_click(o));
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
}

OverlayManager.TryFindRootElement();
OverlayManager.RefreshVisibility();


Modules.Report('Overlays', 'This module provides a reusable code component for screen overlays such as confirmation dialogs.');