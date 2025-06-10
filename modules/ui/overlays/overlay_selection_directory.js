import { SelectionInstance } from "../../utils/selections.js";
import { SelectionOverlay } from "./overlay_selection.js";

export class DirectorySelectionOverlay extends SelectionOverlay
{
    kind = 'directory-selection-overlay';
    onCreateElements(overlay)
    {
        overlay.selection = new SelectionInstance();
        overlay.selection.get_item_identifier = _ => _.Title;
        overlay.e_root.innerHTML = 'NULL DIRECTORY SELECTION OVERLAY CONTENT';
    };
    onRemoveElements(overlay) { };
}