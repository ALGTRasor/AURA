import { GlobalStyling } from "../ui/global_styling.js";
import { OverlayManager } from "../ui/overlay_manager.js";
import { Spotlight } from "../ui/spotlight.js";
import { Hotkeys } from "../utils/hotkeys.js";
import { Fax } from "./fax.js";

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


    static AddBodyEventListeners()
    {
        document.body.addEventListener('wheel', e => AppInput.RefreshGlobalTooltip(e), { passive: true });
        document.body.addEventListener('mouseout', e => AppInput.RefreshGlobalTooltip(e));
        document.body.addEventListener('mousemove', e => AppInput.RefreshGlobalTooltip(e));
    }

    static RefreshGlobalTooltip(e)
    {
        const e_spotlight = document.getElementById('spotlight');
        let info_label = document.getElementById('info-bar-marquee');
        let mouse_element = document.elementFromPoint(e.pageX, e.pageY);
        if (mouse_element && mouse_element.title && mouse_element.title.length > 0)
        {
            window.active_tooltip = mouse_element.title;
            info_label.innerHTML = '<div>' + window.active_tooltip + '</div>';
            if (GlobalStyling.spotlight.enabled === true) 
            {
                Spotlight.Element(mouse_element);
                e_spotlight.style.transitionDelay = '0s';
                e_spotlight.style.opacity = '40%';
            }
        }
        else
        {
            window.active_tooltip = '';
            info_label.innerHTML = '<div>' + Fax.current_fact + '</div>';
            if (GlobalStyling.spotlight.enabled === true) 
            {
                e_spotlight.style.transitionDelay = '0.5s';
                e_spotlight.style.opacity = '0%';
            }
        }
    }
}