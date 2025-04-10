import { addElement } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { FieldValuePanel } from "../ui/panel_field_value.js";
import { RunningTimeout } from "../utils/running_timeout.js";
import { PageBase } from "./pagebase.js";

export class PageMap extends PageBase
{
	GetTitle() { return 'map'; }

	Resize()
	{
		this.limit_size = this.limit_size !== true;
		this.UpdateSize();
	}

	UpdateSize()
	{
		if (this.limit_size) this.e_body.style.maxWidth = '17rem';
		else this.e_body.style.maxWidth = 'unset';
	}

	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();

		this.limit_size = true;
		this.UpdateSize();
		this.title_bar.AddResizeButton();

		this.timeout_UpdateQuery = new RunningTimeout(() => this.UpdateQuery(), 1, 150);

		const style_map = 'position:absolute;inset:0rem;width:100%;height:100%;';
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
			fvp.onValueChanged.RequestSubscription(_ => { this.timeout_UpdateQuery.ExtendTimer(); });
			fvp.Create(parent);
			fvp.e_root.style.height = '2rem';
			return fvp;
		};

		this.e_panel = this.CreatePanel(
			this.e_content, false, true, 'flex-wrap:nowrap;flex-direction:column;',
			_ =>
			{
				this.e_map_panel = this.CreatePanel(_, true, false, 'flex-grow:1.0;', _ =>
				{
					this.e_map_iframe = addElement(_, 'iframe', '', style_map, apply_iframe_properties);
				});

				this.e_options_panel = this.CreatePanel(_, true, false, 'flex-grow:0.0;', _ => { });
				this.input_query = CreateInputField(this.e_options_panel);
			}
		);

		this.FinalizeBody(parent);
	}

	UpdateQuery()
	{
		const url_map_embed = 'https://maps.google.com/maps?hl=en&t=k&ie=UTF8&iwloc=B&output=embed';
		this.e_map_iframe.src = url_map_embed + '&q=' + this.input_query.e_value.value;
	}
}

PageManager.RegisterPage(new PageMap('map', 'aura.access'));