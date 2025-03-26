import { addElement } from "./domutils.js";
import { Modules } from "./modules.js";

export class RecordViewer
{
    constructor(data = [])
    {
        this.data = data;
        this.selected_record = {};
        this.created = false;

        this.sorter = (record) => { return true; };
        this.builder = (table, record, element) => { };

        this.e_root = {};
        this.e_list_root = {};
        this.e_view_root = {};
        this.e_list_items = [];

        this.DeselectData();
    }

    SetListItemSorter(sorter = (record) => { return true; })
    {
        this.sorter = sorter;
    }

    SetListItemBuilder(builder = (table, record, element) => { })
    {
        this.builder = builder;
    }

    SetData(data = [])
    {
        this.data = data;
    }

    DeselectData()
    {
        this.selected_record = null;
        this.RefreshElementVisibility();
    }

    SelectData(selector = record => { return true; })
    {
        this.selected_record = this.data.find(selector);
        this.RefreshElementVisibility();
    }

    CreateElements(parent)
    {
        if (this.created) return;

        this.e_root = addElement(
            parent, 'div', 'record-viewer-root', '',
            e =>
            {
                this.e_list_root = addElement(e, 'div', 'record-viewer-list-root', '', e => { });
                this.e_view_root = addElement(e, 'div', 'record-viewer-view-root', '', e => { });
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

    RefreshListElements()
    {
        this.e_list_root.innerHTML = '';

        if (!this.builder)
        {
            this.e_list_root.innerHTML = 'invalid items';
            return;
        }

        let data_sorted = this.data.sort(this.sorter);
        for (let id in data_sorted)
        {
            let this_item = data_sorted[id];
            const select_this = e => { this.SelectData(x => x.Title == this_item.Title); };
            let e_listitem = addElement(this.e_list_root, 'div', 'record-viewer-list-item', '', e => { e.addEventListener('click', select_this) });
            this.builder(data_sorted, id, e_listitem);
        }
    }
    RefreshViewerElements() { }

    RefreshElementVisibility()
    {
        if (!this.created) return;

        let root_rect = this.e_root.getBoundingClientRect();

        let show_both = root_rect.width > 860;
        let show_list = show_both || this.selected_record === null;
        let show_view = this.selected_record !== null;

        this.e_list_root.style.display = show_list ? 'flex' : 'none';
        this.e_list_root.style.maxWidth = show_view ? '24rem' : 'unset';
        this.e_view_root.style.display = show_view ? 'flex' : 'none';
    }
}

Modules.Report('Record Viewers');