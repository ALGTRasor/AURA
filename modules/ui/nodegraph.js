import { NotificationLog } from "../notificationlog.js";
import { DropMenu, DropMenuItem, DropMenuManager } from "./dropmenu.js";


const node_kind_default = { kind: 'comment', label: 'Comment', prep: _ => { } };


export class GraphNode extends EventTarget
{
	constructor(id, kind_info = node_kind_default)
	{
		super();
		this.id = id;
		this.graph = null;
		this.kind_info = kind_info;
		this.title = kind_info.label;
		this.inputs = [];
		this.outputs = [];
		this.e_root = this.createElement();
		this.x = 0;
		this.y = 0;
	}

	static GetData(_)
	{
		return {
			id: _.id,
			kind: _.kind_info?.kind ?? 'unknown',
			x: _.x,
			y: _.y
		};
	}

	createElement()
	{
		const el = document.createElement("div");
		el.classList.add("graph-node");
		el.textContent = this.title;
		el.style.position = "absolute";
		el.style.left = "0px";
		el.style.top = "0px";
		el.draggable = true;
		el.addEventListener("dragstart", e => this.onDragStart(e));
		el.addEventListener("dragend", e => this.onDragEnd(e));
		el.addEventListener("mousedown", e => this.onContextClick(e));
		return el;
	}

	onContextClick(event)
	{
		let options = [new DropMenuItem('Delete Node', e => { this.graph.removeNode(this.id) })];
		DropMenuManager.showMenu(new DropMenu(options), new DOMPoint(event.clientX, event.clientY), null);
	}

	onDragStart(event)
	{
		event.dataTransfer.setData("text/node-id", this.id);
		event.dataTransfer.effectAllowed = "move";
		const rect_node = this.e_root.getBoundingClientRect();
		this.grab_offset_x = event.clientX - rect_node.x;
		this.grab_offset_y = event.clientY - rect_node.y;
		this.dispatchEvent(new CustomEvent("nodestartdrag", { detail: this }));
		event.stopPropagation();
	}

	onDragEnd(event)
	{
		event.dataTransfer.setData("text/node-id", this.id);
		event.dataTransfer.effectAllowed = "move";
		this.dispatchEvent(new CustomEvent("nodeenddrag", { detail: this }));
	}

	setPosition(x, y)
	{
		const rem = 16;
		const rem_inv = 1.0 / rem;
		this.x = Math.round(x * rem_inv) * rem;
		this.y = Math.round(y * rem_inv) * rem;
		this.updatePosition();
	}

	updatePosition()
	{
		this.e_root.style.left = `${this.x}px`;
		this.e_root.style.top = `${this.y}px`;
	}
}

const nodeRegistry = new Map();
export class NodeGraph extends EventTarget
{
	node_kinds = [];

	constructor(container)
	{
		super();
		this.container = container;
		this.nodes = new Map();
		this.connections = new Set();
		this.root = document.createElement("div");
		this.root.classList.add("node-graph-root");
		this.root.style.position = "relative";
		this.container.appendChild(this.root);
		this.init();
		nodeRegistry.set(this, this);
	}

	get_node_kind_info(kind)
	{
		let kind_id = this.node_kinds.findIndex(_ => _.kind === kind);
		if (kind_id < 0) return node_kind_default;
		return this.node_kinds[kind_id];
	};

	static GetData(graph)
	{
		let data = { node_data: [] };
		graph.nodes.forEach(_ => { return data.node_data.push(GraphNode.GetData(_)); });
		return data;
	}

	static SetData(graph, data = {})
	{
		if ('node_data' in data)
		{
			for (let node_info_id in data.node_data)
			{
				let node_info = data.node_data[node_info_id];
				let node = new GraphNode(node_info.id, graph.get_node_kind_info(node_info.kind));
				graph.addNode(node, true);
				node.setPosition(node_info.x, node_info.y);
			}
		}
	}

	registerNodeKind(new_kind = node_kind_default) { this.node_kinds.push(new_kind); }

	init()
	{
		this.root.addEventListener("dragover", e => e.preventDefault());
		this.root.addEventListener("drop", e => this.onDrop(e));

		this.root.addEventListener(
			'mousedown',
			e =>
			{
				let dismissing = e.button != 1;
				dismissing = dismissing && !(e.button == 0 && e.ctrlKey === true);
				if (dismissing)
				{
					DropMenuManager.hideAll();
					return;
				}
				this.ShowContextMenu(new DOMPoint(e.clientX, e.clientY));
				e.preventDefault();
				e.stopPropagation();
			}
		);
	}

	ShowContextMenu(pos)
	{
		let create_node_of_kind = (_, posx, posy) =>
		{
			return new DropMenuItem(
				_.label,
				e =>
				{
					let rect_root = this.root.getBoundingClientRect();
					let node = this.addNodeOfKind(_.kind);
					node.setPosition(posx - rect_root.x, posy - rect_root.y);
				}
			);
		};

		DropMenuManager.showMenu(new DropMenu(this.node_kinds.map(_ => { return create_node_of_kind(_, pos.x, pos.y) })), pos, null);
	}

	addNode(node, skip_events = false)
	{
		this.nodes.set(node.id, node);
		node.graph = this;
		this.root.appendChild(node.e_root);
		node.addEventListener("nodestartdrag", e => this.onNodeStartDrag(e));
		node.addEventListener("nodeenddrag", e => this.onNodeEndDrag(e));
		if (skip_events !== true)
		{
			this.dispatchEvent(new CustomEvent("nodeadded", { detail: node }));
			this.dispatchEvent(new CustomEvent("changed", { detail: node }));
		}
		return node;
	}

	removeNode(nodeId)
	{
		const node = this.nodes.get(nodeId);
		if (node)
		{
			node.e_root.remove();
			this.nodes.delete(nodeId);
			this.dispatchEvent(new CustomEvent("noderemoved", { detail: node }));
			this.dispatchEvent(new CustomEvent("changed", { detail: node }));
		}
	}

	transferNode(nodeId, targetGraph, x, y)
	{
		const node = this.nodes.get(nodeId);
		if (node)
		{
			this.removeNode(nodeId);
			targetGraph.addNode(node);
			node.setPosition(x, y);
		}
	}

	addNodeOfKind(kind = '')
	{
		let kind_info = this.get_node_kind_info(kind);
		if (kind_info == undefined) return undefined;

		const id = `node-${Date.now()}`;
		const node = new GraphNode(id, kind_info);

		if (kind_info.prep) kind_info.prep(node);
		return this.addNode(node);
	}

	onNodeStartDrag(e)
	{
	}

	onNodeEndDrag(e)
	{
		this.dispatchEvent(new CustomEvent("nodemoved", { detail: e.detail }));
		this.dispatchEvent(new CustomEvent("changed", { detail: e.detail }));
	}

	onDrop(event)
	{
		const nodeId = event.dataTransfer.getData("text/node-id");
		if (!nodeId) { NotificationLog.Log('invalid node id', '#f80'); return; }
		event.preventDefault();
		event.stopPropagation();

		let rect_root = this.root.getBoundingClientRect();
		let x = event.clientX - rect_root.x;
		let y = event.clientY - rect_root.y;

		for (const [graph] of nodeRegistry)
		{
			if (graph !== this && graph.nodes.has(nodeId))
			{
				let node = graph.nodes.get(nodeId);
				x -= node.grab_offset_x;
				y -= node.grab_offset_y;
				graph.transferNode(nodeId, this, x, y);
				return;
			}
		}

		let node = this.nodes.get(nodeId);
		x -= node.grab_offset_x;
		y -= node.grab_offset_y;
		if (node) node.setPosition(x, y);
	}
}
