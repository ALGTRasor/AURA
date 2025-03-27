import { Modules } from "../modules.js";
import { DataFieldDesc } from "./datafield_desc.js";

export class ExternalContact
{
	static table_fields = [
		'id', 'Title', 'contact_name', 'contact_type', 'contact_title',
		'mailing_address', 'contact_email', 'contact_phone', 'contact_website',
		'contact_notes'
	];

	static field_descs =
		{
			'id': new DataFieldDesc('id', 'id', false, true),
			'Title': new DataFieldDesc('Title', 'contact guid', false, true),
			'contact_name': new DataFieldDesc('contact_name', 'contact name'),
			'contact_type': new DataFieldDesc('contact_type', 'contact type', false, false, 'upper'),
			'contact_title': new DataFieldDesc('contact_title', 'contact title'),
			'mailing_address': new DataFieldDesc('mailing_address', 'mailing address', false, false, 'address'),
			'contact_email': new DataFieldDesc('contact_email', 'email', false, false, 'email'),
			'contact_phone': new DataFieldDesc('contact_phone', 'phone', false, false, 'phone'),
			'contact_website': new DataFieldDesc('contact_website', 'website', false, false, 'url'),
			'contact_notes': new DataFieldDesc('contact_notes', 'notes', false, false, null, true),
		};
}

Modules.Report("External Contacts");