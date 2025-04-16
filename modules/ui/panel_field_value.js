import { addElement, CreatePagePanel } from "../domutils.js";
import { EventSource } from "../eventsource.js";
import { RunningTimeout } from "../utils/running_timeout.js";
import { PanelBase } from "./panel_base.js";

export class FieldValuePanel extends PanelBase
{
	label = '';
	value = '';
	value_original = '';

	multiline = false;
	spellcheck = false;
	value_dirty = false;
	validator = _ => _.trim();

	minWidth = '10rem';
	edit_mode = true;

	onValueChanged = new EventSource();
	onValueChangedDelayed = new EventSource();
	valueChangeTimeout = new RunningTimeout(() => { this.onValueChangedDelayed.Invoke() }, 0.6, false, 50);

	TryValidateValue(target_value) 
	{
		if (this.validator) return this.validator(target_value);
		return target_value;
	}

	getSourceValue() { return this.value; }
	setSourceValue(new_value)
	{
		let prev_value = this.value;
		this.value = new_value;
		this.AfterSourceValueChanged(prev_value);
	}
	AfterSourceValueChanged(prev_value = '')
	{
		this.value = this.TryValidateValue(this.value);
		this.e_value.value = this.value;
		this.AfterAnyValueChanged(prev_value, this.value);
	}

	getLiveValue() { return this.e_value.value; }
	setLiveValue(new_value)
	{
		let prev_value = this.e_value.value;
		this.e_value.value = new_value;
		this.AfterLiveValueChanged(prev_value);
	};
	AfterLiveValueChanged(prev_value = '')
	{
		this.e_value.value = this.TryValidateValue(this.e_value.value);
		this.AfterAnyValueChanged(prev_value, this.e_value.value);
	}

	AfterAnyValueChanged(prev_value = '', new_value = '')
	{
		this.onValueChanged.Invoke({ value_original: this.value_original, value_current: new_value });
		this.valueChangeTimeout.ExtendTimer();
		this.RefreshStyling();
	}

	last_caret_char = '';
	last_caret_pos = -1;
	last_caret_at_end = false;
	PushCaretPos()
	{
		this.last_caret_pos = this.e_value.selectionStart;
		this.last_caret_at_end = this.last_caret_pos >= (this.e_value.value.length - 1);
		this.last_caret_char = this.e_value.value.substring(this.last_caret_pos, 1);
	}
	PopCaretPos(old_value, new_value)
	{
		let new_caret_pos = -1;
		let length_delta = new_value.length - old_value.length;

		if (this.last_caret_at_end) new_caret_pos = new_value.length;
		if (new_caret_pos < 0) new_caret_pos = new_value.indexOf(this.last_caret_char, this.last_caret_pos + length_delta - 1);
		if (new_caret_pos < 0) new_caret_pos = new_value.indexOf(this.last_caret_char, this.last_caret_pos);
		if (new_caret_pos < 0) new_caret_pos = new_value.indexOf(this.last_caret_char);
		if (new_caret_pos < 0) new_caret_pos = this.last_caret_pos;

		this.e_value.value = new_value;
		this.e_value.selectionStart = new_caret_pos;
		this.e_value.selectionEnd = new_caret_pos;
	}

	handle_FieldChange(e) 
	{
		//e.stopPropagation();

		let unvalidated_value = this.e_value.value;

		if (this.validator)
		{
			this.PushCaretPos();
			let validated_value = this.validator(unvalidated_value);
			this.value_dirty = this.value_original !== validated_value;
			if (this.value_dirty === true) this.PopCaretPos(unvalidated_value, validated_value);
		}

		this.value = this.e_value.value; // copy live value to source

		this.OnRefresh();
		this.onValueChanged.Invoke({ value_original: this.value_original, value_current: this.e_value.value });
		this.valueChangeTimeout.ExtendTimer();
	}

	OnCreate()
	{
		this.value_original = this.value;

		this.e_root = CreatePagePanel(this.e_parent, false, false, '', _ => { _.className += ' field-panel-row'; });
		this.e_label = addElement(this.e_root, 'div', 'field-panel-label');
		this.e_value = addElement(
			this.e_root, 'textarea', 'field-panel-value', '',
			_ =>
			{
				//_.type = 'textarea';
				_.value = this.value;
				_.spellcheck = this.spellcheck;
				_.autocapitalize = 'off';
				_.autocorrect = 'off';
				_.autocomplete = 'off';
				_.disabled = this.edit_mode !== true;
				_.placeholder = 'Add ' + this.label + '...';

				if (this.multiline === true) _.setAttribute('multiline', '');
				else _.removeAttribute('multiline', '');

				_.addEventListener('keyup', e => e.stopPropagation());
				_.addEventListener('input', e => this.handle_FieldChange(e));
			}
		);

		this.OnRefresh();
	}

	OnRefresh()
	{
		this.e_label.innerText = this.label;//.toUpperCase();
		//this.e_value.value = this.value;
		this.RefreshStyling();
	}

	OnRemove() { this.e_root.remove(); }

	SetValue(new_value = '', skip_validation = false, set_original = false)
	{
		this.value = new_value;
		if (skip_validation !== true && this.validator) this.value = this.validator(this.value);

		if (set_original === true) this.value_original = this.value;
		this.value_dirty = this.value !== this.value_original;

		this.e_value.value = this.value;
		this.RefreshStyling();
	}

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

		if (this.value === 'NULL' || this.value === undefined)
		{
			this.e_value.value = '';
			this.e_value.style.color = 'orangered';
		}
		else 
		{
			this.e_value.style.color = 'inherit';
		}
	}
}