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

export function fadeRemoveElement(target = {}, beforeRemove = () => { }, min_scale = '95%')
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