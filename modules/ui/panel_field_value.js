import { addElement, CreatePagePanel } from "../domutils.js";
import { EventSource } from "../eventsource.js";
import { RunningTimeout } from "../utils/running_timeout.js";
import { PanelBase } from "./panel_base.js";

export class FieldValuePanel extends PanelBase
{
	label = '';
	value = '';

	value_dirty = false;
	validator = _ => _.trim();

	minWidth = '10rem';
	edit_mode = true;

	onValueChanged = new EventSource();
	onValueChangedDelayed = new EventSource();
	valueChangeTimeout = new RunningTimeout(() => { this.onValueChangedDelayed.Invoke() }, 0.369, false, 50);

	OnCreate()
	{
		const style_shared = 'display:inline-block; position:relative; align-content:center; height:100%; font-size:0.7rem; padding:0; margin:0;';

		this.e_root = CreatePagePanel(this.e_parent, false, false, 'border-radius:0.25rem; flex-grow:0.0; padding:0; min-height:1.5rem;');
		this.e_label = addElement(
			this.e_root, 'div', '',
			style_shared + 'text-align:right; left:0; padding-right:0.5rem; width:calc(max(' + this.minWidth + ', 25%) - 0.5rem);'
			+ 'background:#0003; float:left; height:100%; border-radius:0 0.5rem  0.5rem 0;'
		)
		this.e_value = addElement(
			this.e_root, 'input', '',
			style_shared + 'text-align:left; right:0; padding-left:0.5rem; width:calc(100% - max(' + this.minWidth + ', 25%) - 0.5rem);min-width:0;',
			_ =>
			{
				_.type = 'text';
				_.value = this.value;
				_.disabled = this.edit_mode !== true;

				_.addEventListener(
					'keyup',
					e =>
					{
						if (this.validator) _.value = this.validator(_.value);
						this.value_dirty = _.value !== this.value;

						this.RefreshStyling();
						e.stopPropagation();

						this.onValueChanged.Invoke({ value_original: this.value, value_current: _.value });
						this.valueChangeTimeout.ExtendTimer();
					}
				);
			}
		);
		this.RefreshStyling();
	}

	OnRefresh()
	{
		this.e_label.innerText = this.label.toUpperCase();
		this.e_value.value = this.value;
		if (this.value === 'NULL' || this.value === undefined) this.e_value.style.color = 'orangered';
		else this.e_value.style.color = 'inherit';
	}

	OnRemove() { this.e_root.remove(); }

	SetEditMode(edit_mode = true)
	{
		this.edit_mode = edit_mode;
		this.RefreshStyling();
	}

	RefreshStyling()
	{
		this.e_value.disabled = this.edit_mode !== true;

		if (this.value_dirty === true)
		{
			this.e_value.setAttribute('valuechanged', '');
			this.e_label.setAttribute('valuechanged', '');
		}
		else
		{
			this.e_value.removeAttribute('valuechanged');
			this.e_label.removeAttribute('valuechanged');
		}
	}
}