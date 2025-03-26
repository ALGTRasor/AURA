export function addElement(parent = {}, tag = 'div', className = '', style = '', prep = e => { })
{
    let e = document.createElement((tag && tag.length > 0) ? tag : 'div');
    if (className && className.length > 0) e.className = className;
    if (style && style.length > 0) e.style = style;
    if (prep) prep(e);
    if (parent && parent.appendChild) parent.appendChild(e);
    return e;
};