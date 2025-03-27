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

    constructor(key = '', label = '', sensitive = false, exclude = false, format_mode = '', multiline = false)
    {
        this.key = key;
        this.label = label;
        this.sensitive = sensitive;
        this.exclude = exclude;
        this.format_mode = format_mode;
        this.multiline = multiline;
    }
}

Modules.Report('DataField Descriptors');