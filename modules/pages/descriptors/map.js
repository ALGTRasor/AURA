import { addElement } from "../../domutils.js";
import { PageManager } from "../../pagemanager.js";
import { FieldValuePanel } from "../../ui/panel_field_value.js";
import { UserAccountInfo } from "../../useraccount.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { PageDescriptor } from "../pagebase.js";

export class PageMap extends PageDescriptor
{
	pinnable = true;
	GetTitle() { return 'map'; }

	Resize(instance)
	{
		instance.state_data.expanding = instance.state_data.expanding !== true;
		this.UpdateSize(instance);
	}

	UpdateSize(instance)
	{
		if (instance.state_data.expanding) instance.e_frame.style.maxWidth = 'unset';
		else instance.e_frame.style.maxWidth = '17rem';
	}

	OnCreateElements(instance)
	{
		if (!instance) return;

		this.UpdateSize(instance);

		instance.timeout_UpdateQuery = new RunningTimeout(() => this.UpdateQuery(instance), 1, 150);

		const apply_iframe_properties = _ =>
		{
			_.setAttribute('sandbox', 'allow-scripts');
			_.frameborder = '0';
			_.scrolling = 'no';
			_.marginheight = '0';
			_.marginwidth = '0';
			_.loading = 'lazy';
		};

		const CreateInputField = (parent) =>
		{
			let fvp = new FieldValuePanel();
			fvp.label = 'Search';
			fvp.value = 'Texas';
			fvp.edit_mode = true;
			fvp.spellcheck = false;
			fvp.validator = undefined;//_ => _.trim();
			fvp.onValueChanged.RequestSubscription(_ => { instance.timeout_UpdateQuery.ExtendTimer(); });
			fvp.Create(parent);
			fvp.e_root.style.height = '2rem';
			return fvp;
		};

		const style_map = 'position:absolute;inset:0rem;width:100%;height:100%;';
		instance.e_panel = instance.CreatePanel(
			instance.e_content, false, true, 'flex-wrap:nowrap;flex-direction:column;',
			_ =>
			{
				instance.e_map_panel = instance.CreatePanel(_, true, false, 'flex-grow:1.0;', _ =>
				{
					instance.e_map_iframe = addElement(_, 'iframe', '', style_map, apply_iframe_properties);
				});

				instance.e_options_panel = instance.CreatePanel(_, true, false, 'flex-grow:0.0;', _ => { });
				instance.input_query = CreateInputField(instance.e_options_panel);
			}
		);

	}

	UpdateQuery(instance)
	{
		const url_map_embed = 'https://maps.google.com/maps?hl=en&t=k&ie=UTF8&iwloc=B&output=embed';
		instance.e_map_iframe.src = url_map_embed + '&q=' + instance.input_query.e_value.value;
	}
}

PageManager.RegisterPage(new PageMap('map', UserAccountInfo.app_access_permission));