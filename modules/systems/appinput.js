import { OverlayManager } from "../ui/overlay_manager.js";
import { Hotkeys } from "../utils/hotkeys.js";

export class AppInput
{
    static all_pressed_keys = [];

    static IsPressed(key)
    {
        return AppInput.all_pressed_keys.indexOf(key) > -1;
    }

    static HandleKeyDown(e)
    {
        if (e.key.length > 0) AppInput.all_pressed_keys.push(e.key);

        if (OverlayManager.visible && OverlayManager.overlays.length > 0)
        {
            let o = OverlayManager.overlays[OverlayManager.overlays.length - 1];
            if (o && o.HandleHotkeys) o.HandleHotkeys(e);
            return;
        }
    }
    static HandleKeyUp(e)
    {
        if (e.key.length > 0) 
        {
            AppInput.all_pressed_keys = AppInput.all_pressed_keys.filter(_ => _ !== e.key);
        }

        if (OverlayManager.visible && OverlayManager.overlays.length > 0)
        {
            let o = OverlayManager.overlays[OverlayManager.overlays.length - 1];
            if (o && o.HandleHotkeys) o.HandleHotkeys(e);
            return;
        }

        Hotkeys.EvaluateKeyEvent(e);
    }
}