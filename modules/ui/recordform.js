import { DataFieldDesc } from "../datamodels/datafield_desc.js";
import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { Modules } from "../modules.js";

const rgx_datetime = /(\d{4})\-(\d{2})\-(\d{2})(?:T(\d\d\:\d\d\:\d\d)Z?)?/;
const url_maps = 'https://www.google.com/maps/search/?api=1&basemap=satellite&t=k&query=';

export class RecordFormUtils
{
    static CreateRecordInfoList(parent = {}, record = {}, descs = [], info_title = 'info', show_extras = false)
    {
        addElement(parent, 'div', 'info-row-separator', '', e => e.innerText = info_title);

        for (let desc_id in descs) 
        {
            if (desc_id.startsWith('@')) continue;
            RecordFormUtils.CreateRecordInfoListItem(parent, descs, desc_id, record[desc_id]);
        }

        if (show_extras)
        {
            let leftovers = [];
            for (let field_id in record)
            {
                if (!(field_id in descs)) leftovers.push(field_id);
            }

            addElement(parent, 'div', 'info-row-separator', '', e => e.innerText = 'extra');

            for (let leftover_id in leftovers) 
            {
                RecordFormUtils.CreateRecordInfoListItem(parent, descs, leftover_id, record[leftover_id], false);
            }
        }
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
        if (!row_opts) return valstr;
        if (!row_opts.format) return valstr;
        if (row_opts.format.length < 1) return valstr;

        switch (row_opts.format)
        {
            case 'upper':
                valstr = valstr.toUpperCase();
                break;
            case 'team':
                let got_team = SharedData.GetTeamData(valstr);
                if (got_team) valstr = got_team.team_name;
                break;
            case 'role':
                let got_role = SharedData.GetRoleData(valstr);
                if (got_role) valstr = got_role.role_name;
                break;
            case 'user':
                let got_user = SharedData.GetUserData(valstr);
                if (got_user) valstr = got_user.display_name_full;
                break;
            case 'list':
                if (row_opts.list_separator) DebugLog.Log('splitting by ' + row_opts.list_separator);
                let parts = valstr.split(row_opts.list_separator ? row_opts.list_separator : ';');
                if (parts.length > 1) valstr = parts.length + ' ' + row_opts.label;
                break;
            case 'url':
                if (valstr && valstr.length > 0) valstr = `<a href='${valstr}' target='_blank'>${valstr}</a>`
                break;
            case 'address':
                if (valstr && valstr.length > 0) valstr = `<a href='${url_maps}${encodeURI(valstr)}' target='_blank'>${valstr}</a>`
                break;
            case 'email':
                if (valstr && valstr.length > 0) valstr = `<a href='mailto:${valstr}' target='_blank'>${valstr}</a>`
                break;
            case 'phone':
                let nums = [0, 1, 2, 3, 4];
                nums = valstr.replaceAll(/[^\d]/g, '');
                if (nums.length >= 7)
                {
                    nums = nums.insertFromEnd(4, '-');
                    nums = nums.insertFromEnd(8, ') ');
                    nums = nums.insertFromEnd(13, '(');
                    valstr = nums.length > 14 ? '+' + nums.insertFromEnd(14, ' ') : nums;
                }
                break;
            case 'date':
                let dmatch = valstr.match(rgx_datetime);
                if (dmatch) valstr = `${dmatch[1]}-${dmatch[2]}-${dmatch[3]}`;
                break;
            case 'datetime':
                let dtmatch = valstr.match(rgx_datetime);
                if (dtmatch)
                {
                    let year = dtmatch[1];
                    let month = dtmatch[2];
                    let day = dtmatch[3];
                    let time = dtmatch[4];

                    valstr = `${year}-${month}-${day} @${time}`;
                }
                break;
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

        if (this.editable)
        {
        }
        else
        {
            RecordFormUtils.CreateRecordInfoList(this.e_root, this.record, this.field_descs, this.title);
        }
    }
}

Modules.Report('Record Forms', 'This module adds a reusable record field form and utility methods for creating record field forms.');