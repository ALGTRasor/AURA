import { DebugLog } from "../debuglog.js";
import { addElement, fadeAppendChild, fadeRemoveElement, fadeTransformElement, getSiblingIndex } from "../domutils.js";
import { Modules } from "../modules.js";
import { PageManager } from "../pagemanager.js";
import { RecordFormUtils } from "../ui/recordform.js";
import { PageTitleBar } from "./pagetitlebar.js";


export class PageBase
{
	static Default = new PageBase(null);

	title = '';
	state_data = {};

	constructor(title = '', permission = '')
	{
		if (title && title.length > 0) this.title = title;
		else this.title = this.GetTitle();

		this.siblingIndex = -1;
		this.state_data = {};

		this.permission = permission;

		this.title_bar = null;
		this.e_body = {};
		this.e_content = {};
	}

	GetTitle() { return '' }

	SetContentBodyLabel(text)
	{
		if (!this.e_content) return;
		this.e_content.innerHTML = "<div style='position:absolute;inset:0;text-align:center;align-content:center;'>" + text + "</div>";
	}

	CreateBody()
	{
		this.e_body = document.createElement('div');
		this.e_body.className = 'page-root';
		this.title_bar = new PageTitleBar(this, true);
		this.e_content = document.createElement('div');
		this.e_content.className = 'page-content-root';
		this.e_body.appendChild(this.e_content);
	}

	MoveLeft()
	{
		if (!this.e_body.previousSibling) return;
		fadeTransformElement(
			this.e_body.parentElement,
			() =>
			{
				this.e_body.parentElement.insertBefore(this.e_body, this.e_body.previousSibling);
				PageManager.onLayoutChange.Invoke();
			}
		);
	}

	MoveRight()
	{
		if (!this.e_body.nextSibling) return;
		fadeTransformElement(
			this.e_body.parentElement,
			() =>
			{
				this.e_body.parentElement.insertBefore(this.e_body.nextSibling, this.e_body);
				PageManager.onLayoutChange.Invoke();
			}
		);
	}

	Close(immediate = false)
	{
		this.OnClose();

		if (immediate)
		{
			PageManager.onLayoutChange.RemoveSubscription(this.sub_LayoutChange);
			PageManager.RemoveFromCurrent(this, 20);
			this.e_body.remove();
			this.e_body = null;
		}
		else
		{
			fadeRemoveElement(
				this.e_body,
				() =>
				{
					PageManager.onLayoutChange.RemoveSubscription(this.sub_LayoutChange);
					PageManager.RemoveFromCurrent(this, 20);
					this.e_body = null;
				}
			);
		}
	}

	FinalizeBody(parent)
	{
		if (!parent) return;

		fadeAppendChild(parent, this.e_body);

		this.sub_LayoutChange = PageManager.onLayoutChange.RequestSubscription(() => { this.UpdatePageContext(); });
		this.OnOpen();
	}

	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_content.innerText = 'content :: ' + this.title;
		this.FinalizeBody(parent);
	}

	UpdatePageContext()
	{
		if (PageManager.currentPages.length < 2)
		{
			if (this.title !== 'nav menu') this.title_bar.AddCloseButton();
			else this.title_bar.RemoveCloseButton();
			this.title_bar.RemoveNavigationButtons();
		}
		else
		{
			this.title_bar.AddCloseButton();
			this.title_bar.RemoveNavigationButtons();
			this.title_bar.AddNavigationButtons(this.e_body.previousElementSibling != null, this.e_body.nextElementSibling != null);
		}

		this.siblingIndex = getSiblingIndex(this.e_body);
		this.OnLayoutChange();
	}

	UpdateStateData(state_data = {})
	{
		let prop_count = 0;
		for (let prop_id in state_data)
		{
			this.state_data[prop_id] = state_data[prop_id];
			prop_count++;
			//DebugLog.Log(` - Page State Data [${prop_count}] ${prop_id}: ${this.state_data[prop_id]}`);
		}
		if (prop_count > 0) this.OnStateChange();
	}

	CreatePanel(parent = {}, inset = false, tiles = false, styling = '', prep = e => { })
	{
		let classes = 'page-panel';
		if (inset) classes += ' inset-box';
		if (tiles) classes += ' page-panel-tiles scroll-y';
		return addElement(parent, 'div', classes, styling, prep);
	}



	OnOpen() { }
	OnClose() { }
	OnLayoutChange() { }
	OnStateChange() { }
}

Modules.Report("Pages");