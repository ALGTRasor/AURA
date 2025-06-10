// A class used to keep and monitor a distinct set of values of an arbitrary type
// Override 'get_item_identifier' to change how item equivalency is determined
// Available Events: change, firstadded, itemadded, itemremoved, allremoved
export class SelectionInstance extends EventTarget
{
    items = [];
    any_selected = false;

    get_item_identifier = item => item;

    indexOf(item)
    {
        let item_identifier = this.get_item_identifier(item);
        return this.items.findIndex((x, i, a) => this.get_item_identifier(x) === item_identifier);
    }

    contains(item) { return this.indexOf(item) > -1; }

    check_any()
    {
        this.any_selected = this.items.length > 0;
        return this.any_selected;
    }

    clear()
    {
        if (this.any_selected === false) return false;
        this.items = [];
        this.any_selected = false;
        this.dispatchEvent(new CustomEvent('change', { detail: this.items }));
        this.dispatchEvent(new CustomEvent('allremoved', { detail: this }));
        return true;
    }

    toggle(item) { if (this.contains(item)) this.remove(item); else this.add(item); }

    add(item)
    {
        let existing_index = this.indexOf(item);
        if (existing_index > -1) return false;

        let was_any_selected = this.any_selected === true;
        this.items.push(item);
        this.check_any();

        this.dispatchEvent(new CustomEvent('change', { detail: this.items }));
        this.dispatchEvent(new CustomEvent('itemadded', { detail: item }));
        if (was_any_selected !== true) this.dispatchEvent(new CustomEvent('firstadded', { detail: item }));
        return true;
    }

    remove(item)
    {
        if (this.items.length < 1) return false;

        let existing_index = this.indexOf(item);
        if (existing_index < 0) return false;

        this.items.splice(existing_index, 1);
        this.check_any();

        this.dispatchEvent(new CustomEvent('change', { detail: this.items }));
        this.dispatchEvent(new CustomEvent('itemremoved', { detail: item }));
        if (this.any_selected === false) this.dispatchEvent(new CustomEvent('allremoved', { detail: this.items }));
        return true;
    }
}