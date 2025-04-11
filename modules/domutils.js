export function addElement(parent = {}, tag = 'div', className = '', style = '', prep = e => { })
{
    let e = document.createElement((tag && tag.length > 0) ? tag : 'div');
    if (className && className.length > 0) e.className = className;
    if (style && style.length > 0) e.style = style;
    if (prep) prep(e);
    if (parent && parent.appendChild) parent.appendChild(e);
    return e;
};


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




const fade_duration_ms = 250;
const fade_duration_quick_ms = 120;
export function fadeAppendChild(parent = {}, child = {}, min_scale = '95%')
{
    if (!child) return;
    if (!parent || !parent.appendChild) return;

    let def_pointerEvents = 'unset';
    let def_userSelect = 'unset';

    if (child.style)
    {
        def_pointerEvents = child.style.pointerEvents;
        def_userSelect = child.style.userSelect;

        child.style.transitionDuration = '0s';
        child.style.pointerEvents = 'none';
        child.style.userSelect = 'none';
        child.style.opacity = '0%';
        child.style.scale = min_scale;
    }

    const start_fade = () =>
    {
        if (child.style)
        {
            child.style.transitionDuration = fade_duration_ms + 'ms';
            child.style.opacity = '100%';
            child.style.scale = '100%';
        }
    };

    window.setTimeout(
        () =>
        {
            start_fade();
            const end_fade = () =>
            {
                if (child.style)
                {
                    child.style.pointerEvents = def_pointerEvents;
                    child.style.userSelect = def_userSelect;
                }
            };
            window.setTimeout(end_fade, fade_duration_ms);
        },
        10
    );

    parent.appendChild(child);
}

export function fadeRemoveElement(target = {}, beforeRemove = () => { }, min_scale = '95%')
{
    if (!target) return;

    if (target.style)
    {

        target.style.transitionDuration = fade_duration_ms + 'ms';
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
            };
            window.setTimeout(end_fade, fade_duration_ms);
        },
        10
    );
}

export function fadeTransformElement(target = {}, transformation = () => { })
{
    if (!target) return;

    let def_pointerEvents = 'unset';
    let def_userSelect = 'unset';
    let def_filter = 'none';

    if (target.style)
    {
        def_pointerEvents = target.style.pointerEvents;
        def_userSelect = target.style.userSelect;
        def_filter = target.style.filter;
        target.style.pointerEvents = 'none';
        target.style.userSelect = 'none';
    }

    const start_fade = () =>
    {
        if (target.style)
        {
            target.style.opacity = '20%';
            target.style.filter = 'blur(0.25rem)';
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
            target.style.filter = def_filter;
        }
    };

    window.setTimeout(start_fade, 10);
    window.setTimeout(mid_fade, fade_duration_quick_ms + 10);
    window.setTimeout(end_fade, fade_duration_quick_ms * 2 + 10);
}