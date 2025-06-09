import { PageManager } from "../../pagemanager.js";
import { PdfContent } from "../../ui/pdf_content.js";
import { UserAccountInfo } from "../../useraccount.js";
import { CreatePagePanel } from "../../utils/domutils.js";
import { PageDescriptor } from "../pagebase.js";

export class PagePdfView extends PageDescriptor
{
	title = 'pdf view';
	hidden_page = true;

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.state.data.target_url = '';

		instance.e_frame.style.minWidth = '32rem';
		instance.e_content.style.overflow = 'hidden';

		instance.e_viewer_root = CreatePagePanel(instance.e_content, true, true, 'flex-direction:column;');

		instance.viewer = new PdfContent(instance.e_viewer_root);
		instance.viewer.CreateElements();
		if ('target_url' in instance.state.data) instance.viewer.Load(instance.state.data.target_url);
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let fixed_width = instance.state.data.docked === true && instance.state.data.expanding === false;
		if (fixed_width === true) instance.e_frame.style.maxWidth = '32rem';
		else instance.e_frame.style.maxWidth = '64rem';
	}
}

PageManager.RegisterPage(new PagePdfView('pdf view', UserAccountInfo.app_access_permission));