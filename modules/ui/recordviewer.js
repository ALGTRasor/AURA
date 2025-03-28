import { DebugLog } from "../debuglog.js";
import { addElement } from "../domutils.js";
import { Modules } from "../modules.js";

export class RecordViewer
{
    constructor(data = [])
    {
        this.data = data;
        this.selected_records = [];
        this.selected_record = () => this.selected_records && this.selected_records.length > 0 ? this.selected_records[0] : null;
        this.e_selected_listitem = {};
        this.created = false;

        this.sorter = (record) => { return true; };
        this.filterBuilder = () => { };
        this.listItemBuilder = (table, record, element) => { };
        this.viewBuilder = (records) => { };

        this.e_root = {};
        this.e_list_root = {};
        this.e_view_root = {};
        this.e_list_items = {};

        this.listitems = [];

        this.DeselectData();
    }

    SetData(data = []) { this.data = data; }
    SetfilterBuilder(builder = () => { }) { this.filterBuilder = builder; }
    SetListItemBuilder(builder = (table, record, element) => { }) { this.listItemBuilder = builder; }
    SetListItemSorter(sorter = (record) => { return true; }) { this.sorter = sorter; }
    SetViewBuilder(builder = (records) => { }) { this.viewBuilder = builder; }

    DeselectData()
    {
        this.selected_records = [];
        this.RefreshElementVisibility();
    }

    SelectData(selector = record => { return true; })
    {
        if (!record) DebugLog.Log('record not found...');
        else this.selected_records.push(this.data.find(selector));
        this.RefreshElementVisibility();
    }

    SelectRecord(record = {}, click_event = e => { })
    {
        if (!record) DebugLog.Log('record not found...');
        else
        {
            let multiselect = click_event && click_event.ctrlKey;
            let sel_id = this.selected_records.indexOf(record);
            if (sel_id > -1)
            {
                if (multiselect) this.selected_records.splice(sel_id, 1);
                else
                {
                    this.selected_records = [];
                    this.selected_records.push(record);
                }
            }
            else
            {
                if (!multiselect) this.selected_records = [];
                this.selected_records.push(record);
            }
            this.RefreshElementVisibility();
        }
    }

    CreateElements(parent)
    {
        if (this.created) return;

        this.e_root = addElement(
            parent, 'div', 'record-viewer-root', '',
            e =>
            {
                this.e_list_root = addElement(e, 'div', 'record-viewer-list-root', '', _ =>
                {
                    this.e_list_filters = addElement(_, 'div', 'record-viewer-list-filters', '', x => { });
                    this.e_list_items = addElement(_, 'div', 'record-viewer-list-items', '', x => { });
                    this.e_list_tip = addElement(_, 'div', 'record-viewer-list-tip', '', x => { x.innerText = 'hold ctrl for multiselect' });
                });
                this.e_view_root = addElement(e, 'div', 'record-viewer-view-root', '', _ => { });
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
        this.RefreshListElements();
        this.RefreshViewerElements();
        this.RefreshElementVisibility();
    }

    CreateFilterElements()
    {
        if (this.filterBuilder) this.filterBuilder();
    }

    RefreshListElements()
    {
        this.e_list_items.innerHTML = '';

        if (!this.listItemBuilder)
        {
            this.e_list_items.innerHTML = 'invalid items';
            return;
        }

        this.listitems = [];
        let data_sorted = this.data.sort(this.sorter);
        for (let id in data_sorted)
        {
            let this_item = data_sorted[id];
            const select_this = (event, e) =>
            {
                this.SelectRecord(this_item, event);
                this.RefreshViewerElements();
            };
            let e_listitem = addElement(this.e_list_items, 'div', 'record-viewer-list-item', '', e => { e.addEventListener('click', event => select_this(event, e)) });
            this.listItemBuilder(data_sorted, id, e_listitem);

            this.listitems.push(
                {
                    e_root: e_listitem,
                    record: this_item
                }
            );
        }
    }
    RefreshViewerElements()
    {
        if (!this.created) return;

        this.e_view_root.innerHTML = '';
        if (this.viewBuilder && this.selected_records && this.selected_records.length > 0)
        {
            if (this.selected_records.length > 1 && false)
            {
                addElement(
                    this.e_view_root, 'div', 'info-row-separator', null,
                    e =>
                    {
                        e.innerText = `${this.selected_records.length} SELECTED`;
                        e.style.backgroundColor = 'rgba(from hsl(from var(--theme-color) calc(h + 180) s 50%) r g b / 0.5)';
                        e.style.color = 'hsl(from var(--theme-color) h s 90%)';
                        e.style.fontWeight = 'bold';
                    }
                );
            }
            this.viewBuilder(this.selected_records);
        }
    }

    RefreshElementVisibility()
    {
        if (!this.created) return;

        let any_selected = this.selected_records && this.selected_records.length > 0;

        let root_rect = this.e_root.getBoundingClientRect();

        let show_both = root_rect.width > 860;
        let show_list = show_both || !any_selected;
        let show_view = any_selected;

        this.e_list_root.style.maxWidth = show_view ? '20rem' : 'unset';
        this.e_list_root.style.display = show_list ? 'flex' : 'none';

        this.e_view_root.style.display = show_view ? 'flex' : 'none';

        if (show_list || show_both)
        {
            for (let id in this.listitems)
            {
                let listitem = this.listitems[id];
                let sel_id = this.selected_records.indexOf(listitem.record);
                if (sel_id > -1) listitem.e_root.className = 'record-viewer-list-item selected';
                else listitem.e_root.className = 'record-viewer-list-item';
            }
        }
    }
}

Modules.Report('Record Viewers');