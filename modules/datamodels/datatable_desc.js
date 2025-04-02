import { Modules } from "../modules.js";
import { DataFieldDesc } from "./datafield_desc.js";

export class DataTableDesc
{
    static Nothing = new DataTableDesc(null);

    fields = [];
    field_descs = {};

    constructor(field_descs = {})
    {
        this.fields = [];
        for (let id in field_descs) this.fields.push(id);
        this.field_descs = field_descs;
    }

    static Build(descs = [])
    {
        let descs_expanded = {};
        for (let desc_index in descs)
        {
            let desc = descs[desc_index];
            if (!desc.key) continue;
            if (!desc.label) desc.label = desc.key;
            let exp = new DataFieldDesc(desc.key, desc.label);
            if (desc.sensitive) exp.sensitive = desc.sensitive;
            if (desc.exclude) exp.exclude = desc.exclude;
            if (desc.format) exp.format = desc.format;
            if (desc.multiline) exp.multiline = desc.multiline;
            descs_expanded[desc.key] = exp;
        }
        return new DataTableDesc(descs_expanded);
    }
}

Modules.Report('DataTable Descriptors', 'This module adds a reusable code component that describes one database table and its fields.');