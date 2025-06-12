import { addElement } from "../utils/domutils.js";
import { Modules } from "../modules.js";

export class ExpandingSummary
{
    e_root = {};
    expanded = false;

    before_expand = () => { };
    after_expand = () => { };
    before_collapse = () => { };
    after_collapse = () => { };

    constructor(title = 'item')
    {
        this.e_root = {};
        this.title = title;
        this.expanded = false;
    }

    SetExpanded(expanded = true)
    {
        if (expanded === true) this.Expand();
        else this.Collapse();
    }

    ToggleExpanded()
    {
        if (this.expanded === false) this.Expand();
        else this.Collapse();
    }

    Expand()
    {
        if (this.expanded === true) return;
        if (this.before_expand) this.before_expand();
        this.expanded = true;
        this.e_root.style.minHeight = '8rem';
        this.e_root.style.textWrapMode = 'wrap';
        this.e_root.style.alignContent = 'start';
        if (this.after_expand) this.after_expand();
    }

    Collapse()
    {
        if (this.expanded === false) return;
        if (this.before_collapse) this.after_collapse();
        this.expanded = false;
        this.e_root.style.minHeight = '1.25rem';
        this.e_root.style.textWrapMode = 'nowrap';
        if (this.after_collapse) this.after_collapse();
    }

    CreateElements(parent)
    {
        if (this.created === true) return;
        this.e_root = addElement(
            parent, 'div', 'page-panel panel-button',
            'flex-basis:0; flex-grow:1.0; flex-shrink:0.0; align-content:start; padding-left:0.5rem;',
            _ =>
            {
                _.innerText = this.title;
                _.title = this.title;
            }
        );
        this.e_root.style.transitionProperty = 'min-height';
        this.e_root.style.transitionDuration = 'var(--trans-dur-off-fast)';
        this.e_root.style.transitionTimingFunction = 'ease-in-out';
        this.e_root.addEventListener('click', _ => this.ToggleExpanded());
        this.created = true;
    }

    RemoveElements()
    {
        if (!this.created) return;
        this.e_root.remove();
        this.created = false;
    }
}

Modules.Report('Expanding Summaries', 'This module adds a reusable expanding summary component.');