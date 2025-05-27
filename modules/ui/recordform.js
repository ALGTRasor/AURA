import { Modules } from "../modules.js";
import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { FieldValidation } from "../utils/field_validation.js";
import { DataFieldDesc } from "../datamodels/datafield_desc.js";

export class RecordFormUtils
{
    static CreateRecordInfoList(parent = {}, record = {}, descs = [], info_title = 'info', show_extras = false)
    {
        let e_root = CreatePagePanel(parent, true, true, 'flex-wrap:nowrap;flex-direction:column;');

        for (let desc_id in descs) 
        {
            if (desc_id.startsWith('@')) continue;
            RecordFormUtils.CreateRecordInfoListItem(e_root, descs, desc_id, record[desc_id]);
        }

        if (show_extras)
        {
            let leftovers = [];
            for (let field_id in record)
            {
                if (field_id in descs) continue;
                leftovers.push(field_id);
            }

            for (let id in leftovers) RecordFormUtils.CreateRecordInfoListItem(e_root, descs, id, record[id], false);
        }

        return e_root;
    }

    static CreateRecordInfoListItem(parent = {}, field_descs = [], desc_id = '', value = '', format = true)
    {
        let row_opts = DataFieldDesc.Lookup(field_descs, desc_id);
        if (row_opts.exclude) return '';

        let sens = row_opts.sensitive === true;
        let sens_txt = sens ? ' [ SENSITIVE ]' : '';
        let sens_ind = sens ? '*' : '';

        let label = row_opts ? row_opts.label : desc_id;
        let labelUpper = label.toUpperCase();

        let value_raw = value ? value.toString().trim() : '';
        value = value_raw;

        if (format) value = RecordFormUtils.FormatValueString(value_raw, row_opts);

        if (row_opts.multiline)
        {
            value = value.replaceAll('\n\n', '<br>');
            value = value.replaceAll('\n', '<br>');
        }

        addElement(
            parent, 'div', 'info-row', row_opts.multiline === true ? 'min-height:3rem; flex-grow:0.0;' : '',
            e =>
            {
                let str_tip = `${labelUpper}${sens_txt}`;
                let e_lbl_label = addElement(
                    e, 'span', 'info-label', null,
                    lbl =>
                    {
                        lbl.title = str_tip;
                        lbl.innerHTML = `${label}${sens_ind}`;
                    }
                );
                let e_lbl_value = addElement(
                    e, 'span', sens ? 'info-value sensitive-info' : 'info-value',
                    row_opts.multiline === true ? 'min-height:1.5rem; text-wrap:pretty; flex-grow:0.0; padding:0.5rem;' : '',
                    lbl =>
                    {
                        lbl.title = value_raw;
                        lbl.innerHTML = value;
                        lbl.style.lineHeight = row_opts.multiline ? '1rem' : 'inherit';
                        lbl.style.overflowY = row_opts.multiline ? 'auto' : 'hidden';
                    }
                );

                if (value_raw && value_raw.length > 0)
                    addElement(
                        e, 'div', 'info-value-button', '',
                        btn => 
                        {
                            addElement(
                                btn, 'i', 'material-symbols icon', 'font-variant:normal;',
                                x =>
                                {
                                    x.innerText = 'content_copy';
                                    x.title = row_opts.sensitive === true ? 'Copy value' : 'Copy value: "' + value_raw + '"';
                                }
                            );
                            btn.addEventListener('click', clickevent => navigator.clipboard.writeText(value_raw));
                        }
                    );
            }
        );
    }


    static FormatValueString(valstr = '', row_opts = {})
    {
        if ('format' in row_opts)
        {
            let validator = FieldValidation.GetValidator(row_opts.format);
            if (validator) return validator(valstr);
            return valstr;
        }
        return valstr;
    }
}

export class RecordForm
{
    constructor(title = '', field_descs = [], record = {})
    {
        this.title = title;
        this.field_descs = field_descs;
        this.record = record;

        this.e_root = {};
        this.editable = false;
    }

    CreateElements(parent)
    {
        if (this.created) return;

        this.e_root = CreatePagePanel(parent, false, false, '', e => { });

        this.created = true;
        this.RefreshAllElements();
    }

    RemoveElements()
    {
        if (!this.created) return;
        this.e_root.remove();
        this.created = false;
    }

    SetEditable(editable = true)
    {
        this.editable = editable;
        this.RefreshAllElements();
    }

    RefreshAllElements()
    {
        if (!this.created) return;
        this.RefreshFormElements();
    }

    RefreshFormElements()
    {
        this.e_root.innerHTML = '';

        if (this.editable === true)
        {
        }
        else
        {
            RecordFormUtils.CreateRecordInfoList(this.e_root, this.record, this.field_descs, this.title);
        }
    }
}

Modules.Report('Record Forms', 'This module adds a reusable record field form and utility methods for creating record field forms.');