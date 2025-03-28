import { Modules } from "../modules.js";

export class DataTableDesc
{
    static Nothing = new DataTableDesc(null);

    constructor(field_descs = {})
    {
        this.fields = field_descs ? Array.prototype.slice.apply(field_descs).map(x => x.key) : [];
        this.field_descs = field_descs;
    }
}

Modules.Report('DataTable Descriptors');