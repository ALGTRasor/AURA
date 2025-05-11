import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { PanelContent } from "./panel_content.js";

export class PdfContent extends PanelContent
{
	OnCreateElements()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, false, 'flex-basis:100%;');

		this.e_view_object = addElement(
			this.e_root, 'object', null, null,
			_ =>
			{
				_.type = 'application/pdf';
				_.data = '';
			}
		);
	}
	OnRefreshElements() { }
	OnRemoveElements() { this.e_root.remove(); }

	Load(url = '')
	{
		this.e_view_object.data = url;
	}
}