import { LongOps } from "../systems/longops.js";

export class FileUploadInstance extends EventTarget
{
    constructor(file, drive_id = '', relative_path = '')
    {
        super();

        this.file = file;
        this.drive_id = drive_id;
        this.relative_path = relative_path;

        this.file_name = this.file.name.trim();
        this.operation_id = 'upload-file' + this.file_name;
        this.url_content = window.SharePoint.url_api + `/drives/${this.drive_id}/root:/${this.relative_path}/${this.file_name}:/content`;

        this.contents_read = false;
        this.submitted = false;
        this.success = false;

        this.file_contents = undefined;
        this.op_upload = undefined;
        this.result = undefined;
    }

    async Process()
    {
        this.success = false;
        this.op_upload = LongOps.Start(this.operation_id, { label: this.file_name, icon: 'upload', verb: 'Uploaded file' });
        await this.ReadFileContents();
        await this.SubmitFileContents();
        LongOps.Stop(this.op_upload);

        this.file = undefined;
        this.file_contents = undefined;
    }

    async ReadFileContents()
    {
        if (this.contents_read === true) return;
        this.file_contents = await this.file.arrayBuffer();
        this.contents_read = true;

        this.dispatchEvent(new CustomEvent('afterread', {}));
    }

    async SubmitFileContents()
    {
        if (typeof this.drive_id !== 'string' || this.drive_id.length < 1) 
        {
            console.warn('Invalid Drive ID');
            return undefined;
        }

        if (this.submitted === true) return;
        this.result = await window.SharePoint.SetData(this.url_content, this.file_contents, 'put', 'text/plain');
        this.submitted = true;

        this.dispatchEvent(new CustomEvent('afterupload', {}));
    }
}