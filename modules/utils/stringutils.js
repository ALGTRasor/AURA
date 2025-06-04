String.prototype.insert = function (index, string)
{
	if (index < 1) return string + this;
	if (index >= this.length) return this + string;
	return this.substring(0, index) + string + this.substring(index, this.length);
};

String.prototype.insertFromEnd = function (index, string)
{
	index = this.length - index;
	if (index < 1) return string + this;
	if (index >= this.length) return this + string;
	return this.substring(0, index) + string + this.substring(index, this.length);
};

const time_units = [
	{ unit: 'ms', size: 1 },
	{ unit: 's', size: 1000 },
	{ unit: 'm', size: 60 },
	{ unit: 'hr', size: 60 },
	{ unit: 'days', size: 24 },
	{ unit: 'weeks', size: 7 },
	{ unit: 'months', size: 4 },
	{ unit: 'years', size: 12 },
];

export function getDurationString(duration_ms = 1000)
{
	if (duration_ms < 1000) return Math.ceil(duration_ms) + 'ms';

	let unit_index = 0;
	let duration_unit = time_units[unit_index];
	let duration_unit_next = time_units[unit_index + 1];
	let duration_val = duration_ms;
	while (unit_index < (time_units.length - 1) && duration_val >= duration_unit_next.size)
	{
		unit_index++;
		duration_unit = time_units[unit_index];
		duration_unit_next = time_units[unit_index + 1];
		duration_val /= duration_unit.size;
	}
	return Math.ceil(duration_val * 10) / 10 + duration_unit.unit;
}