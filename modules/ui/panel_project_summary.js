import { addElement, CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { FieldValuePanel } from "./panel_field_value.js";

export class ProjectSummary extends PanelBase
{
	project_data = null;

	info_client = null;
	info_location = null;
	info_scope = null;
	info_status = null;

	OnCreate()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, true, 'min-width:38rem;min-height:12rem;align-content:start;');

		const style_title = 'flex-basis:100%;padding-left:2rem;text-align:left;height:1.5rem;line-height:1.5rem;font-weight:bold;letter-spacing:1px;';
		this.e_title = CreatePagePanel(this.e_root, true, false, style_title);

		this.e_blocks = addElement(this.e_root, 'div', '', 'flex-basis:100%;flex-wrap:nowrap;overflow:hidden;flex-direction:row;display:flex;');

		const style_block = 'display:flex; flex-basis:0.0; flex-direction:column; flex-wrap:nowrap; padding:2px; gap:3px;';
		this.e_block_left = CreatePagePanel(this.e_blocks, true, false, style_block + 'flex-grow:2.0; gap:3px;');
		this.e_block_right = CreatePagePanel(this.e_blocks, true, false, style_block + 'flex-grow:3.0; gap:3px;');

		this.info_client = this.PushChild(new FieldValuePanel());
		this.info_client.minWidth = '6rem';
		this.info_client.label = "client";
		this.info_client.Create(this.e_block_left);

		this.info_location = this.PushChild(new FieldValuePanel());
		this.info_location.minWidth = '6rem';
		this.info_location.label = "location";
		this.info_location.Create(this.e_block_left);

		this.info_scope = this.PushChild(new FieldValuePanel());
		this.info_scope.minWidth = '6rem';
		this.info_scope.label = "scope";
		this.info_scope.Create(this.e_block_left);

		this.info_status = this.PushChild(new FieldValuePanel());
		this.info_status.minWidth = '6rem';
		this.info_status.label = "status";
		this.info_status.Create(this.e_block_left);
	}

	OnRefresh()
	{
		if (this.project_data)
		{
			this.e_title.innerText = this.project_data.name;

			this.info_client.value = this.project_data.client_id;
			this.info_location.value = this.project_data.location;
			this.info_scope.value = this.project_data.scope;
			this.info_status.value = this.project_data.status;

			this.e_block_right.innerHTML = '';
			let aspect_count = Math.random() * 9 + 3;
			for (let ii = 0; ii < aspect_count; ii++)
			{
				CreatePagePanel(this.e_block_right, false, false, '', _ =>
				{
					_.innerText = 'aspect information goes here';
					_.style.borderRadius = '0.25rem';
				});
			}
		}
		else
		{
			this.e_title.innerText = 'NULL PROJECT';

			this.info_client.value = 'NULL';
			this.info_location.value = 'NULL';
			this.info_scope.value = 'NULL';
			this.info_status.value = 'NULL';

			this.e_block_right.innerHTML = 'NULL ASPECTS';
		}
	}

	OnRemove() { this.e_root.remove(); }
}