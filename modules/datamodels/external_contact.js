import { DataTableDesc } from "./datatable_desc.js";

export class ExternalContact
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'contact guid', exclude: true },
			{ key: 'contact_name', label: 'contact name' },
			{ key: 'contact_type', label: 'contact type' },
			{ key: 'contact_title', label: 'contact title', format: 'upper' },
			{ key: 'mailing_address', label: 'mailing address', format: 'address' },
			{ key: 'contact_email', label: 'email', format: 'email' },
			{ key: 'contact_phone', label: 'phone', format: 'phone' },
			{ key: 'contact_website', label: 'website', format: 'url' },
			{ key: 'contact_notes', label: 'notes', multiline: true },
		]
	);
}