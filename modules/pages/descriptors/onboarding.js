
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class PageOnboarding extends PageDescriptor
{
	GetTitle() { return 'onboarding'; }
	CreateElements(parent)
	{
		if (!parent) return;

		this.sub_SharedDataRefresh = {};

		this.icon = 'person';

		this.CreateBody();
		this.e_body.style.minWidth = '32rem';

		this.e_content.style.flexWrap = 'nowrap';
		this.e_content.style.flexDirection = 'column';


		this.FinalizeBody(parent);

	}

	OnOpen()
	{
	}

	OnClose()
	{
	}

	OnLayoutChange()
	{
	}
}

PageManager.RegisterPage(new PageOnboarding('onboarding'));