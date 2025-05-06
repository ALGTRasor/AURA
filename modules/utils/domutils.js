import { AnimJob } from "../AnimJob.js";
import { lerp } from "./mathutils.js";
import { until } from "./until.js";

export function addElement(parent = {}, tag = 'div', className = '', style = '', prep = e => { })
{
    let e = document.createElement((tag && tag.length > 0) ? tag : 'div');
    if (className && className.length > 0) e.className = className;
    if (style && style.length > 0) e.style = style;
    if (prep) prep(e);
    if (parent && parent.appendChild) parent.appendChild(e);
    return e;
};


export function MoveArrayItem(items = [], from = 0, to = 0)
{
    if (!items || !items.length || from < 0 || from === to) return;
    var x = items.splice(from, 1);
    items.splice(to, 0, x);
}



export function getSiblingIndex(element = {})
{
    let e_parent = element.parentElement;
    if (e_parent == null) 
    {
        console.warn('null parent for getSiblingIndex');
        return -1;
    }

    for (let ii = 0; ii < e_parent.children.length; ii++)
    {
        if (e_parent.children.item(ii) == element) return ii;
    }
    console.warn('no element match for getSiblingIndex');
    return -1;
}

export function setSiblingIndex(element = {}, new_index = 0)
{
    if (new_index <= 0) element.parentElement.insertBefore(element, element.parentElement.firstElementChild);
    else if (new_index >= element.parentElement.children.length) element.parentElement.insertBefore(element, null);
    else element.parentElement.insertBefore(element, element.parentElement.children.item(new_index + 1));
}







export function CreatePagePanel(parent = {}, inset = false, tiles = false, styling = '', prep = e => { })
{
    let classes = 'page-panel';
    if (inset) classes += ' inset-box';
    if (tiles) classes += ' page-panel-tiles scroll-y';
    let e = addElement(parent, 'div', classes, styling, prep);
    return e;
}

export function AddPagePanelInsetShadow(e_panel)
{
    addElement(e_panel, 'div', 'page-panel-inset-shadow');
}



export function secondsDelta(x = new Date(), y = new Date())
{
    let delta = 0;
    if (x > y) delta = x - y;
    else delta = y - x;
    return delta * 0.001;
}




export async function FadeElement(target, opacity_from = 0, opacity_to = 100, duration_seconds = 0.125)
{
    if (!target) return;

    let phase = 0.0;

    const step_size = 1.0 / Math.max(0.05, duration_seconds);
    const apply_opacity = _ => target.style.filter = `opacity(${_}%)`;
    const step_fade = (dt) =>
    {
        phase += dt * step_size;
        apply_opacity(lerp(opacity_from, opacity_to, phase));
    };

    let anim = new AnimJob(30, step_fade);
    apply_opacity(opacity_from);
    anim.Start();
    await until(_ => phase >= 1.0);
    anim.Stop();
    apply_opacity(opacity_to);
}




const fade_duration_ms = 250;
const fade_duration_quick_ms = 120;

export function fadeAppendChild(parent = {}, child = {}, min_scale = '95%')
{
    if (!child) return;
    if (!child.style) return;
    if (!parent || !parent.appendChild) return;

    let def_transitionDuration = 'unset';
    let def_pointerEvents = 'unset';
    let def_userSelect = 'unset';
    let def_opacity = 'unset';
    let def_scale = 'unset';

    def_transitionDuration = child.style.transitionDuration;
    def_pointerEvents = child.style.pointerEvents;
    def_userSelect = child.style.userSelect;
    def_opacity = child.style.opacity;
    def_scale = child.style.scale;

    child.style.transitionDuration = '0s';
    child.style.pointerEvents = 'none';
    child.style.userSelect = 'none';
    child.style.opacity = '0%';
    child.style.scale = min_scale;

    const start_fade = () =>
    {
        child.style.transitionDuration = 'var(--trans-dur-on-slow)';
        child.style.opacity = def_opacity;
        child.style.scale = def_scale;
    };

    window.setTimeout(
        () =>
        {
            start_fade();
            const end_fade = () =>
            {
                child.style.transitionDuration = def_transitionDuration;
                child.style.pointerEvents = def_pointerEvents;
                child.style.userSelect = def_userSelect;
                child.style.opacity = def_opacity;
                child.style.scale = def_scale;
            };
            window.setTimeout(end_fade, fade_duration_ms);
        },
        10
    );

    parent.appendChild(child);
}

export function fadeRemoveElement(target = {}, beforeRemove = () => { }, min_scale = '95%', afterRemove = () => { },)
{
    if (!target) return;

    if (target.style)
    {

        target.style.transitionDuration = 'var(--trans-dur-on-slow)';
        target.style.pointerEvents = 'none';
        target.style.userSelect = 'none';
    }

    const start_fade = () =>
    {
        if (target.style)
        {
            target.style.opacity = '0%';
            target.style.scale = min_scale;
        }
    };

    window.setTimeout(
        () =>
        {
            start_fade();

            const end_fade = () =>
            {
                if (beforeRemove) beforeRemove();
                if (target.remove) target.remove();
                if (afterRemove) afterRemove();
            };
            window.setTimeout(end_fade, fade_duration_ms);
        },
        10
    );
}

export function fadeReplaceElement(e_old = {}, e_new = {}, fade_duration = 125, remove_action = e => { e.remove(); })
{
    let valid_old = e_old && e_old.style;
    let valid_new = e_new && e_new.style;

    let og_values = {
        opacity: '100%',
        transitionProperty: 'none',
        transitionDuration: '0s'
    };
    let e_parent = null;

    function fetch_og_values() 
    {
        if (valid_old) 
        {
            e_parent = e_old.parentElement;
        }
        if (valid_new) 
        {
            og_values.opacity = e_new.style.opacity;
            og_values.transitionProperty = e_new.style.transitionProperty;
        }
    };

    function fade_out_old()
    {
        if (valid_old) 
        {
            e_old.style.opacity = '0%';
            e_new.style.transitionProperty = 'opacity';
        }
        if (valid_new)
        {
            e_new.style.transitionDuration = '0s';
            e_new.style.opacity = '0%';
        }
    };

    function fade_in_new() 
    {
        if (valid_new)
        {
            if (e_parent && e_parent.appendChild) e_parent.appendChild(e_new);
            e_new.style.transitionProperty = 'opacity';
            e_new.style.transitionDuration = fade_duration + 'ms';
            e_new.style.opacity = og_values.opacity;
        }
        if (valid_old)
        {
            if (remove_action) remove_action(e_old);
            else e_old.remove();
        }
    };

    function cleanup()
    {
        e_new.style.removeProperty('transition-property');
        e_new.style.removeProperty('transition-duration');
        e_new.style.removeProperty('opacity');
    };

    fetch_og_values();
    fade_out_old();
    window.setTimeout(fade_in_new, fade_duration);
    window.setTimeout(cleanup, fade_duration * 2);

}

export function fadeTransformElement(target = {}, transformation = () => { }, after = () => { })
{
    if (!target) return;

    let def_pointerEvents = 'unset';
    let def_userSelect = 'unset';
    let def_transition = 'none';

    if (target.style)
    {
        def_pointerEvents = target.style.pointerEvents;
        def_userSelect = target.style.userSelect;
        def_transition = target.style.transitionProperty;
        target.style.pointerEvents = 'none';
        target.style.userSelect = 'none';
    }

    const start_fade = () =>
    {
        if (target.style)
        {
            target.style.transitionProperty = 'opacity';
            target.style.opacity = '0%';
            //target.style.filter = 'blur(0.25rem)';
        }
    };

    const mid_fade = () =>
    {
        if (transformation) transformation();
    };

    const end_fade = () =>
    {
        if (target.style)
        {
            target.style.opacity = '100%';
            target.style.pointerEvents = def_pointerEvents;
            target.style.userSelect = def_userSelect;
            target.style.transitionProperty = def_transition;
        }

        if (after) after();
    };

    window.setTimeout(start_fade, 10);
    window.setTimeout(mid_fade, fade_duration_ms + 10);
    window.setTimeout(end_fade, fade_duration_ms * 2 + 10);
}