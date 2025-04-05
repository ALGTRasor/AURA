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

    static RandDate()
    {
        let d = new Date();
        d.setDate(d.getDate() - Math.random() * 5000);
        return d.toISOString().substring(0, 10);
    }
    static RandInt() { return Math.round(Math.random() * 10); }
    static RandInts(count = 1)
    {
        let res = '';
        for (let ii = 0; ii < count; ii++) res += Math.round(Math.random() * 9);
        return res;
    }

    SpoofRecord()
    {
        let result = {};
        for (let desc_id in this.field_descs)
        {
            let desc = this.field_descs[desc_id];
            if (desc.format)
            {
                switch (desc.format)
                {
                    case 'user': result[desc.key] = 'Employee ' + Math.round(Math.random() * 89999 + 10000); break;
                    case 'contact': result[desc.key] = 'Contact ' + Math.round(Math.random() * 89999 + 10000); break;
                    case 'address': result[desc.key] = DataTableDesc.RandInts(Math.round(3 + Math.random() * 3)) + ' Street Road, City, TX ' + DataTableDesc.RandInts(5); break;
                    case 'phone': result[desc.key] = `(555) ${DataTableDesc.RandInts(3)}-${DataTableDesc.RandInts(4)}`; break;
                    case 'email': result[desc.key] = 'username' + DataTableDesc.RandInts(5) + '@domain.com'; break;
                    case 'date': result[desc.key] = DataTableDesc.RandDate(); break;
                    default: result[desc.key] = desc.key + ' ' + Math.round(Math.random() * 89999 + 10000); break;
                }
            }
            else
            {
                result[desc.key] = desc.key + ' ' + Math.round(Math.random() * 89999 + 10000);
            }
        }
        return result;
    }
}

Modules.Report('DataTable Descriptors', 'This module adds a reusable code component that describes one database table and its fields.');