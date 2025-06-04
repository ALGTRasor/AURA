export class FileType
{
	extensions = ['.txt'];
	label = 'File';
	color = '#fff';
	description = 'This is a file.';

	constructor(extensions = ['.txt'], label = 'File', color = '#fff', description = 'This is a file.', viewable = true)
	{
		this.extensions = extensions;
		this.color = color;
		this.label = label;
		this.description = description;
		this.viewable = viewable;
	}

	MatchExtension(file_name = '')
	{
		for (let eid in this.extensions)
		{
			if (file_name.endsWith(this.extensions[eid])) return true;
		}
		return false;
	}
}

export class FileTypes
{
	static known = [
		new FileType(['.txt'], 'TXT', '#0f0', 'This is a plain text file'),
		new FileType(['.zip'], 'ZIP', '#ffc', 'This is a ZIP archive, a compressed grouping of folders or files', false),
		new FileType(['.xml'], 'XML', '#fcf', 'This is an XML (Extensible Markup Language) file', false),
		new FileType(['.msg'], 'MSG', '#ffc', 'This is an MSG file, Outlook\'s format for storing emails, messages, tasks, appointments, etc', false),
		new FileType(['.eml'], 'EML', '#ffc', 'This is an EML file, a plain text format for storing email messages and their details, contents, and attachments', false),
		new FileType(['.png'], 'PNG', '#fe0', 'This is a PNG (Portable Network Graphics) image'),
		new FileType(['.jpg', '.jpeg'], 'JPG', '#fe0', 'This is a JP(E)G image, from the "Joint Photographic Experts Group"'),
		new FileType(['.csv'], 'CSV', '#0ff', 'This is a CSV (Comma Separated Value) file', false),
		new FileType(['.pdf'], 'PDF', '#f40', 'This is a PDF file, Adobe\'s Portable Document Format'),
		new FileType(['.kml'], 'KML', '#3f4', 'This is a KML file, Google Earth\'s Keyhole Markup Language, used to store geographic annotation', false),
		new FileType(['.kmz'], 'KMZ', '#3f4', 'This is a KMZ file, a compressed version of Google Earth\'s KML', false),
		new FileType(['.docx', '.docm', '.doc'], 'Word', '#35f', 'This is a Word Document file'),
		new FileType(['.xlsx', '.xls', '.xlsm'], 'Excel', '#6f6', 'This is an Excel Spreadsheet file'),
		new FileType(['.pps', '.ppsx'], 'PPT Slideshow', '#fa0', 'This is a PowerPoint Slideshow file'),
		new FileType(['.ppt', '.pptx', '.pot', '.potx'], 'PowerPoint', '#f82', 'This is a PowerPoint file'),
	];

	static known_extensions = FileTypes.known.flatMap(_ => _.extensions);
	static IsKnown(file_name = 'file.txt')
	{
		let ext = FileTypes.GetExtension(file_name);
		return FileTypes.known_extensions.indexOf(ext) > -1;
	}

	static GetExtension(file_name = 'file.txt')
	{
		return file_name.toLowerCase().split('.').at(-1)?.trim();
	}

	static GetInfoIndex(file_name = 'file.txt')
	{
		for (let kid in FileTypes.known)
		{
			if (FileTypes.known[kid].MatchExtension(file_name))
				return kid;
		}
		return -1;
	}

	static GetInfo(file_name = 'file.txt')
	{
		file_name = file_name.toLowerCase();
		let info_index = FileTypes.GetInfoIndex(file_name);
		if (info_index > -1) return FileTypes.known[info_index];

		if (file_name.indexOf('.') < 0) return new FileType([''], 'NO FILE EXTENSION', '#aaa', 'This file does not have an extension');
		let ext = FileTypes.GetExtension(file_name);
		return new FileType([ext], ext.toUpperCase().replace('.', ''), '#aaa', 'This is not a recognized file type');
	}
}