import { addElement, AddElementRemoveListener, FadeElement } from "../utils/domutils.js";
import { sleep } from "../utils/asyncutils.js";
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
    static fading_out = false;
    static fading_in = false;
    static showing = false;

    static PruneReferences()
    {
        const is_valid_tip_instance = mti => { return mti.element && document.body.contains(mti.element); };
        MegaTips.active = MegaTips.active.filter(is_valid_tip_instance);
    }

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
            MegaTips.fading_out = true;
            await FadeElement(MegaTips.e_root, 100, 0, 0.125);
            MegaTips.showing = false;
            MegaTips.fading_out = false;
        }

        await sleep(100);
        MegaTips.PruneReferences();

        if (MegaTips.active.length > 0)
        {
            let tip = MegaTips.active[MegaTips.active.length - 1];
            if (tip && tip.prep)
            {
                MegaTips.RecalculatePosition(tip);

                MegaTips.fading_in = true;
                await FadeElement(MegaTips.e_root, 0, 100, 0.125);
                MegaTips.fading_in = this.fading_in;
                MegaTips.showing = true;
            }
        }

        MegaTips.switching = false;
    }

    static RecalculatePosition(tip = MegaTipInstance.Nothing)
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

        let keep_near_x = Math.min(0.95, Math.max(0, Math.abs(MegaTips.mouse_pos.x - pos.x) - 320) * 0.002);
        pos.x += (MegaTips.mouse_pos.x - pos.x) * keep_near_x;

        if (offset.x < 0) pos.x -= Math.max(24, tip_rect.width);
        if (offset.y < 0) pos.y -= Math.max(24, tip_rect.height);

        let offset_angle = (Math.atan2(offset.x, -offset.y) * 180) / Math.PI;

        MegaTips.e_root.style.setProperty('--anchor-x', -offset.x);
        MegaTips.e_root.style.setProperty('--anchor-y', -offset.y);
        MegaTips.e_root.style.setProperty('--anchor-angle', offset_angle + 'deg');

        MegaTips.SetPosition(pos.x - body_rect.x, pos.y - body_rect.y);
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
        let body_rect = document.body.getBoundingClientRect();
        let etip_rect = MegaTips.e_root.getBoundingClientRect();

        if (x < 0) MegaTips.e_root.style.maxWidth = (etip_rect.width + x) + 'px';
        else if ((x + etip_rect.width) > body_rect.width) MegaTips.e_root.style.maxWidth = (body_rect.width - etip_rect.x) + 'px';
        else MegaTips.e_root.style.maxWidth = '50vw';

        x = Math.min(x, body_rect.width - etip_rect.width);
        x = Math.max(x, 0);
        y = Math.min(y, body_rect.height - etip_rect.height);
        y = Math.max(y, 0);

        MegaTips.e_root.style.left = x + 'px';
        MegaTips.e_root.style.top = y + 'px';
    }

    static FormatHTML(tooltip)
    {
        if (typeof tooltip !== 'string') return tooltip;
        tooltip = tooltip.replaceAll('(((', '<span class="megatip-field">');
        tooltip = tooltip.replaceAll(')))', '</span>');
        tooltip = tooltip.replaceAll('{{{', '<span class="megatip-value">');
        tooltip = tooltip.replaceAll('}}}', '</span>');
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