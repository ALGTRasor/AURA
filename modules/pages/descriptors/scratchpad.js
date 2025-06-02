
import { PageManager } from "../../pagemanager.js";
import { NodeGraph } from "../../ui/nodegraph.js";
import { PageDescriptor } from "../pagebase.js";

export class PageScratchPad extends PageDescriptor
{
	title = 'scratch pad';
	icon = 'notepad';
	order_index = -2;

	OnCreateElements(instance)
	{
		if (!instance) return;
		instance.e_frame.style.minWidth = '20rem';

		instance.graph = new NodeGraph(instance.e_content);
		instance.graph.root.style.flexBasis = '100%';
		instance.graph.registerNodeKind({ kind: 'comment', label: 'Comment', prep: _ => { } });
		instance.graph.registerNodeKind({ kind: 'todo', label: 'To Do List', prep: _ => { } });

		instance.StoreGraphData = () => { instance.UpdateStateData({ graph_data: instance.graph.getData() }); };
		instance.LoadGraphData = () => { instance.graph.setData(instance.state_data.graph_data); };
		instance.LoadGraphData();

		instance.graph.addEventListener('change', _ => { instance.StoreGraphData(); });
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnStateChange(instance)
	{
		if ('StoreGraphData' in instance) instance.StoreGraphData();
	}

	OnLayoutChange(instance)
	{
		let fixed_width = instance.state_data.docked === true && instance.state_data.expanding === false;
		if (fixed_width === true) instance.e_frame.style.maxWidth = '20rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}
}

PageManager.RegisterPage(new PageScratchPad('scratch pad'), 'x', 'Scratch Pad');