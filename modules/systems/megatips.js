import { sleep } from "../utils/asyncutils.js";
import { addElement, FadeElement } from "../utils/domutils.js";
import { RunningTimeout } from "../utils/running_timeout.js";
import { Spotlight } from "../ui/spotlight.js";

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
    static dirty_timeout = new RunningTimeout(MegaTips.SwitchContent, 0.25, 50);
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
        const fade_time = 0.2;

        const try_hide_tip = async () =>
        {
            if (MegaTips.showing === true)
            {
                MegaTips.fading_out = true;
                await FadeElement(MegaTips.e_root, 100, 0, fade_time);
                MegaTips.showing = false;
                MegaTips.fading_out = false;
            }
        };

        const try_show_tip = async () =>
        {
            if (MegaTips.active.length > 0 && window.mobile_mode_enabled !== true)
            {
                let tip = MegaTips.active[MegaTips.active.length - 1];
                if (tip)
                {
                    if ('prep' in tip) tip.prep(MegaTips.e_root);
                    await sleep(10);
                    MegaTips.AdjustTo(tip);
                    Spotlight.Element(tip.element);

                    MegaTips.fading_in = true;
                    await FadeElement(MegaTips.e_root, 0, 100, fade_time);
                    MegaTips.fading_in = this.fading_in;
                    MegaTips.showing = true;
                }
                else
                {
                    Spotlight.None();
                }
            }
            else
            {
                Spotlight.None();
            }
        };

        if (MegaTips.switching === true)
        {
            if (MegaTips.fading_in === true) MegaTips.dirty_timeout.ExtendTimer();
        }
        else
        {
            MegaTips.switching = true;
            await try_hide_tip();
            await sleep(100);
            MegaTips.PruneReferences();
            await try_show_tip();
            MegaTips.switching = false;
        }
    }

    static AdjustTo(tip = MegaTipInstance.Nothing)
    {
        let tip_rect = MegaTips.e_root.getBoundingClientRect();

        let body_rect = document.body.getBoundingClientRect();
        let body_origin = new DOMPoint(body_rect.x, body_rect.y);
        let body_midpoint = new DOMPoint(body_rect.width * 0.5, body_rect.height * 0.5);

        let target_rect = tip.element.getBoundingClientRect();
        let target_midpoint = new DOMPoint(
            target_rect.x + Math.abs(target_rect.width) * 0.5 - body_origin.x,
            target_rect.y + Math.abs(target_rect.height) * 0.5 - body_origin.y
        );

        let anchor_point = new DOMPoint(target_midpoint.x, target_midpoint.y);

        let offset = new DOMPoint(0, 0);
        offset.x = Math.round(0.5 + 0.5 * Math.sign(body_midpoint.x - anchor_point.x)) * 2 - 1;
        offset.y = Math.round(0.5 + 0.5 * Math.sign(body_midpoint.y - anchor_point.y)) * 2 - 1;

        anchor_point.x += offset.x * target_rect.width * 0.5;
        anchor_point.y += offset.y * target_rect.height * 0.5;

        if (offset.x < 0) anchor_point.x -= Math.max(24, Math.abs(tip_rect.width));
        if (offset.y < 0) anchor_point.y -= Math.max(24, Math.abs(tip_rect.height));

        anchor_point.x = Math.round(anchor_point.x);
        anchor_point.y = Math.round(anchor_point.y);

        let offset_angle = (Math.atan2(offset.x, -offset.y) * 180) / Math.PI;

        //let keep_near_x = Math.min(0.95, Math.max(0, Math.abs(MegaTips.mouse_pos.x - pos.x) - 320) * 0.002);
        //pos.x += (MegaTips.mouse_pos.x - pos.x) * keep_near_x;

        MegaTips.e_root.style.setProperty('--anchor-x', offset.x);
        MegaTips.e_root.style.setProperty('--anchor-y', offset.y);
        MegaTips.e_root.style.setProperty('--anchor-angle', offset_angle + 'deg');

        MegaTips.SetPosition(anchor_point.x, anchor_point.y);
    }

    static Push(tip = MegaTipInstance.Nothing)
    {
        if (tip.pushed === true) return;
        tip.pushed = true;

        let active_id = MegaTips.active.indexOf(tip);
        if (active_id >= Math.max(0, MegaTips.active.length - 1)) return; //already forefront

        if (active_id > -1) MegaTips.active.splice(active_id, 1);
        MegaTips.active.push(tip);
        MegaTips.dirty_timeout.ExtendTimer();
    }

    static Pop(tip = MegaTipInstance.Nothing)
    {
        if (tip.pushed !== true) return;
        tip.pushed = false;

        let active_id = MegaTips.active.indexOf(tip);
        if (active_id > -1) MegaTips.active.splice(active_id, 1);
        MegaTips.dirty_timeout.ExtendTimer();
    }

    static CreateElements() { MegaTips.e_root = addElement(document.body, 'div', 'megatip', 'filter:opacity(0%);', _ => { }); }
    static RemoveElements() { if (MegaTips.e_root) MegaTips.e_root.remove(); }

    static SetPosition(x, y)
    {
        let body_rect = document.body.getBoundingClientRect();
        let etip_rect = MegaTips.e_root.getBoundingClientRect();

        x = Math.max(0, Math.min(x, body_rect.width - etip_rect.width));
        y = Math.max(0, Math.min(y, body_rect.height - etip_rect.height));

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
        tooltip = tooltip.replaceAll('<<<', '<span class="megatip-alert">');
        tooltip = tooltip.replaceAll('>>>', '</span>');
        return tooltip;
    }

    static Register(element, prep = _ => { })
    {
        let mti = new MegaTipInstance(element, prep);
        element.addEventListener('mouseenter', e => { MegaTips.UpdateMousePos(e); MegaTips.Push(mti); });
        element.addEventListener('mouseleave', e => { MegaTips.Pop(mti); });
        element.addEventListener('beforeremove', e => { MegaTips.Pop(mti); });
        return mti;
    }

    static RegisterSimple(element, tooltip = '')
    {
        tooltip = MegaTips.FormatHTML(tooltip);
        let mti = new MegaTipInstance(element, _ => { _.innerHTML = tooltip; });
        element.addEventListener('mouseenter', e => { MegaTips.UpdateMousePos(e); MegaTips.Push(mti); });
        element.addEventListener('mouseleave', e => { MegaTips.Pop(mti); });
        element.addEventListener('beforeremove', e => { MegaTips.Pop(mti); });
        return mti;
    }

    static UpdateMousePos(e)
    {
        if (!MegaTips.mouse_pos) MegaTips.mouse_pos = new DOMPoint(0, 0);
        if ('clientX' in e) MegaTips.mouse_pos.x = e.clientX;
        if ('clientY' in e) MegaTips.mouse_pos.y = e.clientY;
    }
}