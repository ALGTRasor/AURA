import { addElement } from "../utils/domutils.js";
import { OverlayManager } from "./overlay_manager.js";

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