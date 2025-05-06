import { DebugLog } from "../debuglog.js";
import { addElement } from "../utils/domutils.js";
import { Modules } from "../modules.js";

export class ProjectViewer
{
    constructor(project_data = [])
    {
        this.project_data = project_data;

        this.e_root = {};
        this.created = false;
    }

    CreateElements(parent)
    {
        if (this.created) return;

        this.e_root = addElement(
            parent, 'div', 'project-viewer-root', '',
            e =>
            {
            }
        );

        this.created = true;
        this.RefreshAllElements();
    }

    RemoveElements()
    {
        if (!this.created) return;
        this.e_root.remove();
        this.created = false;
    }

    RefreshAllElements()
    {
        if (!this.created) return;
    }
}

Modules.Report('Project Viewers', "This module adds ui components for project related views.");