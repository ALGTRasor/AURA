import { LongOps } from "../systems/longops.js";

export class ItemDeleteInstance extends EventTarget
{
    constructor(item_info, drive_id = '', relative_path = '')
    {
        super();

        this.item_info = item_info;
        this.drive_id = drive_id;
        this.relative_path = relative_path;

        this.operation_id = 'delete-item' + this.item_info.id;
        this.url_content = `${window.SharePoint.url_api}/drives/${this.drive_id}/items/${this.item_info.id}`;

        this.submitted = false;

        this.op = undefined;
        this.result = undefined;
    }

    async Process()
    {
        if (this.submitted === true) return;
        this.op = LongOps.Start(this.operation_id, { label: this.item_info.name, icon: 'delete_forever', verb: ('folder' in this.item_info) ? 'Deleted folder' : 'Deleted file' });
        await this.Submit();
    }

    async Submit()
    {
        if (this.submitted === true) return;
        if (typeof this.drive_id !== 'string' || this.drive_id.length < 1) 
        {
            LongOps.Stop(this.op, 'Invalid Drive ID');
            return undefined;
        }

        this.submitted = true;
        this.result = await window.SharePoint.SetData(this.url_content, null, 'delete');

        switch (this.result.status)
        {
            case undefined:
            case 204:
                LongOps.Stop(this.op);
                break;
            case 403: if ('folder' in this.item_info) LongOps.Stop(this.op, '403 Forbidden: Folder must be empty'); else LongOps.Stop(this.op, '403 Forbidden'); break;
            case 404: LongOps.Stop(this.op, '404 Item Not Found'); break;
            default: LongOps.Stop(this.op, `STATUS( ${this.result.status} )`); break;
        }

        this.dispatchEvent(new CustomEvent('completed', { detail: this.result }));
    }
}