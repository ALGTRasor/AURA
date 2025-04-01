import { Modules } from "../modules.js";

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
}

Modules.Report('DataTable Descriptors', 'This module adds a reusable code component that describes one database table and its fields.');