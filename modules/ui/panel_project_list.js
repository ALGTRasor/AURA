import { ProjectCoreData } from "../datamodels/project_data_core.js";
import { SharedData } from "../datashared.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { ProjectSummary } from "./panel_project_summary.js";

export class ProjectList extends PanelBase
{
	panels_summary = [];
	projects = [];

	OnCreate()
	{
		this.e_root = addElement(this.e_parent, 'div', '', 'position:absolute;inset:0.25rem;display:flex;flex-direction:row;flex-wrap:wrap;overflow-y:auto;');
	}
	OnRefresh()
	{
		for (let eid in this.panels_summary) this.panels_summary[eid].Remove();
		this.panels_summary = [];

		if (this.projects && this.projects.length > 0)
		{
			for (let ii = 0; ii < this.projects.length; ii++)
			{
				let panel_summary = new ProjectSummary();
				panel_summary.project_data = projects[ii];
				panel_summary.Create(this.e_root);
				this.panels_summary.push(panel_summary);
			}
		}
		else
		{
			for (let ii = 0; ii < 5; ii++)
			{
				let panel_summary = new ProjectSummary();
				panel_summary.project_data = ProjectCoreData.data_model.SpoofRecord();
				panel_summary.Create(this.e_root);
				panel_summary.e_root.style.setProperty('--theme-color', '#fed');
				this.panels_summary.push(panel_summary);
			}
		}
	}
	OnRemove()
	{
		for (let eid in this.panels_summary) this.panels_summary[eid].Remove();
		this.panels_summary = [];
		this.e_root.remove();
	}
}