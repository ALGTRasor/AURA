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

