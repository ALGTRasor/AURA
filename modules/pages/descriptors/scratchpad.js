
import { Autosave } from "../../autosave.js";
import { PageManager } from "../../pagemanager.js";
import { NodeGraph } from "../../ui/nodegraph.js";
import { PageDescriptor } from "../page_descriptor.js";

export class PageScratchPad extends PageDescriptor
{
	title = 'scratch pad';
	icon = 'notepad';
	order_index = -2;
	coming_soon = true;

	OnCreateElements(instance)
	{
		if (!instance) return;
		instance.e_frame.style.minWidth = 'min(100% - 3 * var(--gap-1), 20rem)';

		instance.graph = new NodeGraph(instance.e_content);
		instance.graph.root.style.flexBasis = '100%';
		instance.graph.registerNodeKind({ kind: 'comment', label: 'Comment', prep: _ => { } });
		instance.graph.registerNodeKind({ kind: 'todo', label: 'To Do List', prep: _ => { } });

		instance.StoreGraphData = () => { instance.SetStateValue('graph_data', NodeGraph.GetData(instance.graph)); Autosave.InvokeSoon(); };
		instance.LoadGraphData = () => { NodeGraph.SetData(instance.graph, instance.GetStateValue('graph_data')); };

		instance.LoadGraphData();
		instance.graph.addEventListener('changed', _ => { instance.StoreGraphData(); });
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnStateChange(instance)
	{

	}

	OnLayoutChange(instance)
	{
		let fixed_width = instance.state.data.docked === true && instance.state.data.expanding === false;
		if (fixed_width === true) instance.e_frame.style.maxWidth = '24rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}
}

PageManager.RegisterPage(new PageScratchPad('scratch pad', undefined, undefined, 'View and manage your work notes.'), 'x', 'Scratch Pad');