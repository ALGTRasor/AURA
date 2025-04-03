import { InternalUser } from "../datamodels/internal_user.js";
import { SharedData } from "../datashared.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { InternalUserSummary } from "./panel_internal_user_summary.js";

export class InternalUserList extends PanelBase
{
	users = [];

	OnCreate()
	{
		this.e_root = addElement(this.e_parent, 'div', '', 'position:absolute;inset:0.25rem;display:flex;flex-direction:row;flex-wrap:wrap;overflow-y:auto;');
	}
	OnRefresh()
	{
		for (let eid in this.panels_summary) this.panels_summary[eid].Remove();
		this.panels_summary = [];

		if (this.users && this.users.length > 0)
		{
			for (let ii = 0; ii < this.users.length; ii++)
			{
				let panel_summary = new InternalUserSummary();
				panel_summary.user_data = this.users[ii];
				panel_summary.Create(this.e_root);
				this.PushChild(panel_summary);
			}
		}
		else
		{
			for (let ii = 0; ii < 15; ii++)
			{
				let panel_summary = new InternalUserSummary();
				panel_summary.user_data = InternalUser.data_model.SpoofRecord();
				panel_summary.Create(this.e_root);
				panel_summary.e_root.style.setProperty('--theme-color', '#fed');
				this.PushChild(panel_summary);
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