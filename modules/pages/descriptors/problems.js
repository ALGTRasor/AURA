import { PageManager } from "../../pagemanager.js";
import { UserAccountInfo } from "../../useraccount.js";
import { CreatePagePanel } from "../../utils/domutils.js";
import { PageDescriptor } from "../pagebase.js";

export class PageProblems extends PageDescriptor
{
	title = 'problems';
	order_index = 98;
	extra_page = true;
	hidden_page = true;

	OnOpen(instance)
	{
		instance.relate_Problems = window.SharedData.auraProblems.instance.AddNeeder();
	}

	OnClose(instance)
	{
		window.SharedData.auraProblems.instance.RemoveNeeder(instance.relate_Problems);
	}

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '32rem';
		instance.e_content.style.overflow = 'hidden';

		let e_problems_root = CreatePagePanel(instance.e_content, true, false, 'display:flex;flex-direction:column;', _ => { _.classList.add('scroll-y'); });

		for (let pid in window.SharedData.auraProblems.instance.data)
		{
			let problem = window.SharedData.auraProblems.instance.data[pid];
			CreatePagePanel(e_problems_root, false, false, '', problem.problem_name);
		}
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true)
		{
			if (instance.state_data.expanding === true) instance.e_frame.style.maxWidth = '64rem';
			else instance.e_frame.style.maxWidth = '32rem';
		}
		else
		{
			instance.e_frame.style.maxWidth = 'unset';
		}
	}
}

PageManager.RegisterPage(new PageProblems('problems', UserAccountInfo.app_access_permission), undefined, 'Problems');