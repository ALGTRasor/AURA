import { addElement, AddElementRemoveListener, FadeElement } from "../utils/domutils.js";
import { RunningTimeout } from "../utils/running_timeout.js";

export class MegaTipInstance
{
    static Nothing = new MegaTipInstance();
    static prep_default = _ => { _.innerHTML = 'Some information'; };

    constructor(element, prep = MegaTipInstance.prep_default)
    {
        this.element = element;
        this.prep = prep;
    }
}

export class MegaTips
{
    static active = [];
    static dirty_timeout = new RunningTimeout(MegaTips.SwitchContent, 0.1, 50);
    static switching = false;
    static fading_in = false;
    static showing = false;

    static async SwitchContent()
    {
        if (MegaTips.switching === true)
        {
            if (MegaTips.fading_in === true) MegaTips.dirty_timeout.ExtendTimer();
            return;
        }

        MegaTips.switching = true;
        if (MegaTips.showing === true)
        {
            await FadeElement(MegaTips.e_root, 100, 0, 0.125);
            MegaTips.showing = false;
        }

        let tip = MegaTips.active[MegaTips.active.length - 1];
        if (tip && tip.prep)
        {
            let body_rect = document.body.getBoundingClientRect();
            let target_rect = tip.element.getBoundingClientRect();
            tip.prep(MegaTips.e_root);

            let tip_rect = MegaTips.e_root.getBoundingClientRect();
            let target_center = new DOMPoint(target_rect.x + target_rect.width * 0.5, target_rect.y + target_rect.height * 0.5);

            let offset = new DOMPoint(0, 0);
            let pos = new DOMPoint(target_center.x, target_center.y);

            if (target_center.x < (body_rect.width * 0.5)) { offset.x = +1.0; }
            else { offset.x = -1.0; }
            if (target_center.y < (body_rect.height * 0.5)) { offset.y = +1.0; }
            else { offset.y = -1.0; }

            pos.x += offset.x * target_rect.width * 0.5;
            pos.y += offset.y * target_rect.height * 0.5;

            let keep_near_x = Math.min(1, Math.max(0, Math.abs(MegaTips.mouse_pos.x - pos.x) - 240) * 0.002);
            pos.x += (MegaTips.mouse_pos.x - pos.x) * keep_near_x;

            if (offset.x < 0) pos.x -= tip_rect.width;
            if (offset.y < 0) pos.y -= tip_rect.height;


            MegaTips.e_root.setAttribute('data-offset-x', -offset.x);
            MegaTips.e_root.setAttribute('data-offset-y', -offset.y);
            let offset_angle = (Math.atan2(offset.x, -offset.y) * 180) / Math.PI;
            MegaTips.e_root.setAttribute('data-offset-angle', offset_angle);

            MegaTips.SetPosition(pos.x - body_rect.x, pos.y - body_rect.y);
            MegaTips.fading_in = true;
            await FadeElement(MegaTips.e_root, 0, 100, 0.125);
            MegaTips.fading_in = this.fading_in;
            MegaTips.showing = true;
        }
        MegaTips.switching = false;
    }

    static Push(tip = MegaTipInstance.Nothing)
    {
        let active_id = MegaTips.active.indexOf(tip);
        if (active_id >= Math.max(0, MegaTips.active.length - 1)) return; //already forefront

        if (active_id > -1) MegaTips.active.splice(active_id, 1);
        MegaTips.active.push(tip);
        MegaTips.dirty_timeout.ExtendTimer();
    }

    static Pop(tip = MegaTipInstance.Nothing)
    {
        let active_id = MegaTips.active.indexOf(tip);
        if (active_id > -1) MegaTips.active.splice(active_id, 1);
        MegaTips.dirty_timeout.ExtendTimer();
    }

    static CreateElements()
    {
        MegaTips.e_root = addElement(document.body, 'div', 'megatip', undefined, _ => { });
    }
    static RemoveElements() { if (MegaTips.e_root) MegaTips.e_root.remove(); }

    static SetPosition(x, y)
    {
        MegaTips.e_root.style.left = x + 'px';
        MegaTips.e_root.style.top = y + 'px';
    }

    static FormatHTML(tooltip)
    {
        if (typeof tooltip !== 'string') return tooltip;
        tooltip = tooltip.replaceAll('(((', '<span class="megatip-field">');
        tooltip = tooltip.replaceAll(')))', '</span>');
        tooltip = tooltip.replaceAll('[[[', '<span class="megatip-warning">');
        tooltip = tooltip.replaceAll(']]]', '</span>');
        return tooltip;
    }

    static Register(element, prep = _ => { })
    {
        let mti = new MegaTipInstance(element, prep);
        element.addEventListener('mouseenter', e => { MegaTips.UpdateMousePos(e); MegaTips.Push(mti); });
        element.addEventListener('mouseleave', e => { MegaTips.UpdateMousePos(e); MegaTips.Pop(mti); });
        AddElementRemoveListener(element, _ => { MegaTips.Pop(mti); });
        return mti;
    }

    static RegisterSimple(element, tooltip = '')
    {
        tooltip = MegaTips.FormatHTML(tooltip);
        let mti = new MegaTipInstance(element, _ => { _.innerHTML = tooltip; });
        element.addEventListener('mouseenter', e => { MegaTips.UpdateMousePos(e); MegaTips.Push(mti); });
        element.addEventListener('mouseleave', e => { MegaTips.UpdateMousePos(e); MegaTips.Pop(mti); });
        AddElementRemoveListener(element, () => { MegaTips.Pop(mti); });
        return mti;
    }

    static UpdateMousePos(e)
    {
        MegaTips.mouse_pos = new DOMPoint(e.clientX, e.clientY);
    }
}