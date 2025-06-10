import { Modules } from "../modules.js";
import { addElement } from "../utils/domutils.js";
import { NotificationLog } from "../notificationlog.js";

export class OverlayInstance extends EventTarget
{
    static Nothing = new OverlayInstance(undefined);

    constructor(descriptor)
    {
        super();

        this.created = false;
        this.descriptor = descriptor;
    }

    Create()
    {
        if (this.created === true) return;
        if (OverlayManager.created_root !== true) return;

        document.activeElement.blur();

        this.e_root = addElement(OverlayManager.e_overlays_root, 'div', 'overlay-root');
        if ('onCreateElements' in this.descriptor) this.descriptor.onCreateElements(this);
        this.created = true;

        OverlayManager.RefreshVisibility();
    }

    Remove()
    {
        if (this.created !== true) return;
        this.created = false;

        if ('onRemoveElements' in this.descriptor) this.descriptor.onRemoveElements(this);
        this.e_root.remove();

        OverlayManager.EnsureRemoved(this);
    }

    HandleHotkeys(event) { this.descriptor.onHandleHotkeys(this, event); }

    Dismiss() { OverlayManager.Hide(this); }
}

export class OverlayDescriptor
{
    kind = 'overlay';
    dismissable = true; // if the overlay can be dismissed by clicking away instead of by interacting with it directly

    onCreateElements = overlay => { overlay.e_root.innerHTML = 'NULL OVERLAY CONTENT'; };
    onRemoveElements = overlay => { };
    onHandleHotkeys = (overlay, event) => { };

    GetNewInstance(data)
    {
        let overlay = new OverlayInstance(this);
        for (let propid in data) overlay[propid] = data[propid];
        return overlay;
    }
}

export class OverlayManager
{
    static created_root = false;
    static visible = false;
    static e_overlays_root = {};
    static overlays = [];

    static OkayChoice = (beforeRemove = _ => { }) =>
    {
        return { label: 'OKAY', on_click: _ => { beforeRemove(); _.Remove(); }, color: '#dfe' };
    };

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

    static EnsureRemoved(overlay = OverlayInstance.Nothing)
    {
        let existing_id = OverlayManager.GetOverlayIndex(overlay);
        if (existing_id > -1) OverlayManager.overlays.splice(existing_id, 1);
        OverlayManager.RefreshVisibility();
    }

    static GetOverlayIndex(overlay = OverlayInstance.Nothing) { return OverlayManager.overlays.indexOf(overlay); }

    static Show(overlay = OverlayInstance.Nothing)
    {
        overlay.Create();
        if (OverlayManager.GetOverlayIndex(overlay) < 0) OverlayManager.overlays.push(overlay);
        OverlayManager.#SetCurrentOverlay();
    }

    static Hide(overlay = OverlayInstance.Nothing)
    {
        let existing_id = OverlayManager.overlays.indexOf(overlay);
        if (existing_id < 0) return;
        OverlayManager.overlays[existing_id].Remove();
        OverlayManager.overlays.splice(existing_id, 1);
        OverlayManager.#SetCurrentOverlay();
    }

    static DismissOne()
    {
        let next_id = OverlayManager.overlays.findIndex(_ => _.descriptor.dismissable === true);
        if (next_id > -1)
        {
            let next_dismissable = OverlayManager.overlays.splice(next_id, 1)[0];
            next_dismissable.Remove();
        }
        OverlayManager.#SetCurrentOverlay();
    }

    static HideAll(dismissable_only = false)
    {
        if (dismissable_only === true)
        {
            let dismissables = OverlayManager.overlays.filter(_ => _.descriptor.dismissable === true);
            OverlayManager.overlays = OverlayManager.overlays.filter(_ => _.descriptor.dismissable !== true);
            dismissables.forEach(x => x.Remove());
        }
        else
        {
            OverlayManager.overlays.forEach(x => x.Remove());
            OverlayManager.overlays = [];
        }

        OverlayManager.#SetCurrentOverlay();
    }

    static #SetCurrentOverlay()
    {
        OverlayManager.current_overlay = OverlayManager.overlays.length > 0 ? OverlayManager.overlays[OverlayManager.overlays.length - 1] : undefined;
        OverlayManager.RefreshVisibility();
    }
}

OverlayManager.TryFindRootElement();
OverlayManager.RefreshVisibility();


Modules.Report('Overlays', 'This module provides a reusable code component for screen overlays such as confirmation dialogs.');