import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { Help } from "./help.js";

export class PageProjectBuilder extends PageDescriptor
{
	title = 'project builder';
	hidden_page = true;

	OnCreateElements(instance)
	{

	}

	OnRefreshElements(instance)
	{

	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state.data.docked === true && instance.state.data.expanding === false) instance.e_frame.style.maxWidth = '36rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}

	OnOpen(instance)
	{

	}

	OnClose(instance)
	{
	}
}

PageManager.RegisterPage(new PageProjectBuilder('project builder', 'projects.create', 'chronic'));
Help.Register(
	'pages.project builder', 'Project Builder',
	'The Project Builder allows new projects to be created and prepared.'
);