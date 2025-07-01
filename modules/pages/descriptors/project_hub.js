import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { PanelContent } from "../../ui/panel_content.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../page_descriptor.js";
import { ProjectData } from "../../datamodels/project_data.js";
import { MegaTips } from "../../systems/megatips.js";


const PROJECT_MODES = [
	{ label: 'ACTIVE', on_click: _ => { }, tooltip: 'View Active Projects' },
	{ label: 'CLOSED', on_click: _ => { }, tooltip: 'View Closed Projects' }
];

class ProjectHubProjectSummary extends PanelContent
{
	constructor(e_parent, hub_content, project)
	{
		super(e_parent);
		this.hub_content = hub_content;
		this.project = project;
	}

	OnCreateElements(data)
	{
		addElement(this.e_parent, 'div', '', 'text-align:center;', _ => { _.innerHTML = this.project.project_name; });
		addElement(this.e_parent, 'div', '', 'text-align:center;', _ => { _.innerHTML = this.project.guid_random; });
		MegaTips.RegisterSimple(this.e_parent, this.project.project_scope ?? 'No scope defined!');
	}
}

class ProjectHubContent extends PanelContent
{
	constructor(e_parent, page)
	{
		super(e_parent);
		this.page = page;

		this.content_timeout = new RunningTimeout(() => { this.RefreshElements(); }, 0.25, false, 70);
		this.refresh_soon = () => { this.content_timeout.ExtendTimer(); };
	}

	OnCreateElements(data)
	{
		this.e_root = addElement(
			this.e_parent, 'div', undefined,
			'position:absolute; inset:0; display:flex; flex-direction:column; flex-wrap:nowrap; padding:var(--gap-05);'
			+ 'gap:var(--gap-025);'
		);

		this.slide_mode = new SlideSelector();
		this.slide_mode.CreateElements(this.e_root, PROJECT_MODES);
		this.e_projects = CreatePagePanel(this.e_root, true, true, 'flex-grow:1.0;flex-basis:1.0;');

		this.slide_mode.Subscribe(() => { this.OnModeChange(); });
		this.slide_mode.SelectIndexAfterDelay(this.page.state.data.view_mode ?? 0, 150, true);
	}
	OnRemoveElements(data) { this.e_root.remove(); }
	OnRefreshElements(data)
	{
		this.TransitionElements(
			() => { this.e_projects.style.pointerEvents = 'none'; },
			() =>
			{
				this.e_projects.innerHTML = '';
				let ii = 0;
				while (ii < SharedData['projects'].instance.data.length)
				{
					let project = SharedData['projects'].instance.data[ii];
					let e_project = CreatePagePanel(this.e_projects, false, false);
					let project_summary = new ProjectHubProjectSummary(e_project, this, project);
					project_summary.CreateElements();
					ii++;
				}
			},
			() => { this.e_projects.style.pointerEvents = 'all'; },
			{
				fade_target: () => this.e_projects,
				fade_duration: 0.125,
				skip_fade_out: false,
				skip_fade_in: false
			}
		);
	}

	OnModeChange()
	{
		this.page.state.SetValue('view_mode', this.slide_mode.selected_index);
		this.RefreshElements();
	}
}

export class PageProjectHub extends PageDescriptor
{
	title = 'project hub';
	order_index = -5;

	OnCreateElements(instance)
	{
		instance.e_frame.style.minWidth = 'min(100% - 3 * var(--gap-1), 32rem)';
		instance.e_content.style.display = 'flex';
		instance.e_content.style.gap = 'var(--gap-025)';

		instance.content = new ProjectHubContent(instance.e_content, instance);
		instance.content.CreateElements();

		instance.relate_projects = window.SharedData['projects'].AddNeeder();
		window.SharedData.Subscribe('projects', instance.refresh_soon);
	}

	OnRemoveElements(instance)
	{
		window.SharedData.Unsubscribe('projects', instance.refresh_soon);
		window.SharedData['projects'].RemoveNeeder(instance.relate_projects);
		instance.content.RemoveElements();
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let use_fixed_width = instance.state.data.docked === true && instance.state.data.expanding === false;
		if (use_fixed_width === true) instance.SetMaxFrameWidth('24rem');
		else instance.ClearMaxFrameWidth();
	}
}

PageManager.RegisterPage(new PageProjectHub('project hub', 'projects.view', undefined, 'View and manage active or archived projects.'), 'p', 'Project Hub');