import { DataTableDesc } from "./datatable_desc.js";

export class AURALink
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'link key' },
			{ key: 'link_label', label: 'link label' },
			{ key: 'link_url', label: 'link url' },
			{ key: 'link_image_path', label: 'link image path' },
			{ key: 'link_description', label: 'link description' },
			{ key: 'link_service_type', label: 'link service type' },
			{ key: 'link_department', label: 'link department' }
		]
	);
}