import { SelectionInstance } from "../../utils/selections.js";
import { OverlayDescriptor } from "../overlay_manager.js";

export class SelectionOverlay extends OverlayDescriptor
{
    kind = 'selection-overlay';
    onCreateElements(overlay)
    {
        overlay.selection = new SelectionInstance();
        overlay.e_root.innerHTML = 'NULL SELECTION OVERLAY CONTENT';
    };
    onRemoveElements(overlay) { };
}