export class DataView
{
	constructor(records = [], filters = [], sorters = [])
	{
		this.records_base = [];
		this.records_view = [];
		this.filters = filters ? Array.from(filters) : [];
		this.sorters = sorters ? Array.from(sorters) : [];

		if (records && records.length > 0) this.SetRecords(records, false, true);
	}

	ClearRecords()
	{
		this.records_base = [];
		this.records_view = [];
		this.RefreshViewRecords();
	}

	SetRecords(records = [], append = true, refresh = true)
	{
		if (records.length < 1)
		{
			if (append !== true) this.ClearRecords();
			return;
		}

		if (append !== true) this.records_base = [];
		records.forEach(_ => this.records_base.push(_));

		if (refresh === true) this.RefreshViewRecords();
	}

	RefreshViewRecords()
	{
		this.ApplyFilters();
		this.ApplySorters();
	}

	ClearFilters() { this.filters = []; }
	AddFilter(filter = record => true) { if (filter) this.filters.push(filter); }
	// ApplyFilters creates a fresh copy of the records_base array before filtering
	ApplyFilters()
	{
		this.records_view = Array.from(this.records_base);
		this.filters.forEach(f => this.records_view = this.records_view.filter(f));
	}

	ClearSorters() { this.sorters = []; }
	AddSorter(sorter = (x, y) => 0) { if (sorter) this.sorters.push(sorter); }
	// ApplySorters sorts the records_view array directly
	ApplySorters() { this.sorters.forEach(s => this.records_view.sort(s)); }
}
