import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { EventSource } from "../eventsource.js";
import { Modules } from "../modules.js";

export class ExpandingSummary
{
    e_root = {};
    expanded = false;

    constructor(title = 'item')
    {
        this.e_root = {};
        this.title = title;
        this.expanded = false;
        this.afterExpand = new EventSource();
        this.afterCollapse = new EventSource();
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
        this.expanded = true;
        this.e_root.style.flexBasis = '6rem';
    }

    Collapse()
    {
        if (this.expanded === false) return;
        this.expanded = false;
        this.e_root.style.flexBasis = 'unset';
    }

    CreateElements(parent)
    {
        if (this.created === true) return;
        this.e_root = addElement(parent, 'div', 'page-panel panel-button', 'flex-grow:0.0; flex-shrink:0.0; min-width:10rem;', _ => _.innerText = this.title);
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