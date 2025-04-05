import { ExternalContact } from "../datamodels/external_contact.js";
import { SharedData } from "../datashared.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { ExternalContactSummary } from "./panel_external_contact_summary.js";

export class ExternalContactList extends PanelBase
{
	contacts = [];

	OnCreate()
	{
		this.e_root = addElement(this.e_parent, 'div', '', 'position:absolute;inset:0.25rem;display:flex;flex-direction:row;flex-wrap:wrap;overflow-y:auto;');
	}
	OnRefresh()
	{
		for (let cid in this.children) this.children[cid].Remove();
		this.children = [];

		if (this.contacts && this.contacts.length > 0)
		{
			for (let ii = 0; ii < this.contacts.length; ii++)
			{
				let panel_summary = new ExternalContactSummary();
				panel_summary.contact_data = this.contacts[ii];
				panel_summary.Create(this.e_root);
				this.PushChild(panel_summary);
			}
		}
		else // spoof records
		{
			for (let ii = 0; ii < 15; ii++)
			{
				let panel_summary = new ExternalContactSummary();
				panel_summary.contact_data = ExternalContact.data_model.SpoofRecord();
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