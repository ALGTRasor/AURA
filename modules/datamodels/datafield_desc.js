import { Modules } from "../modules.js";

export class DataFieldDesc
{
    static Nothing = new DataFieldDesc('nothing', 'nothing');

    static Lookup(descs = [], key = '')
    {
        if (!key || typeof key !== 'string') return DataFieldDesc.Nothing;

        let got_desc = descs[key];
        if (got_desc) return got_desc;
        return new DataFieldDesc(key, key);
    }

    constructor(key = '', label = '', sensitive = false, exclude = false, format = '', multiline = false, read_only = false)
    {
        this.key = key;
        this.label = label;
        this.sensitive = sensitive;
        this.exclude = exclude;
        this.format = format;
        this.multiline = multiline;
        this.read_only = read_only;
    }
}

Modules.Report('DataField Descriptors', 'This module adds a reusable code component that describes one field from a database table.');