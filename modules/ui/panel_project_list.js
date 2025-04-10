import { ProjectData } from "../datamodels/project_data.js";
import { addElement } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { ProjectSummary } from "./panel_project_summary.js";

export class ProjectList extends PanelBase
{
	projects = [];

	OnCreate()
	{
		this.e_root = addElement(this.e_parent, 'div', 'scroll-y', 'position:absolute;inset:0;padding:0.5rem;display:flex;flex-direction:row;flex-wrap:wrap;gap:0.5rem;');
	}
	OnRefresh()
	{
		if (this.projects && this.projects.length > 0)
		{
			for (let ii = 0; ii < this.projects.length; ii++)
			{
				let panel_summary = new ProjectSummary();
				panel_summary.project_data = this.projects[ii];
				panel_summary.Create(this.e_root);
				this.PushChild(panel_summary);
			}
		}
		else
		{
			for (let ii = 0; ii < 5; ii++)
			{
				let panel_summary = new ProjectSummary();
				panel_summary.project_data = ProjectData.data_model.SpoofRecord();
				panel_summary.Create(this.e_root);
				panel_summary.e_root.style.setProperty('--theme-color', '#fed');
				this.PushChild(panel_summary);
			}
		}
	}
	OnRemove()
	{
		this.e_root.remove();
	}
}