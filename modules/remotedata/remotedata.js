export class RemoteDataUsage
{
	static bytesDownloaded = 0;

	static RegisterBytesDownloaded(byteCount)
	{
		RemoteDataUsage.bytesDownloaded += byteCount;
	}
}

export class RemoteDataConnection
{
	constructor(dataConnectionName = "Unknown Data Connection", msRefreshDelay = 1000)
	{
		this.dataConnectionName = dataConnectionName;
		this.msRefreshDelay = msRefreshDelay;

		this.waitingForData = false;
		this.refreshLoopIntervalId = -1;
		this.onRefreshData = async () => { };
		this.afterRefreshData = () => { };
	}

	StartRefreshLoop()
	{
		if (this.refreshLoopIntervalId > -1) return;
		this.RefreshData();
		this.refreshLoopIntervalId = window.setInterval(this.RefreshData.bind(this), this.msRefreshDelay);
	}

	StopRefreshLoop()
	{
		if (this.refreshLoopIntervalId < 0) return;
		window.clearInterval(this.refreshLoopIntervalId);
		this.refreshLoopIntervalId = -1;
	}

	async GetData(path, useCache = true)
	{
		var resp = await fetch(path, { cache: (useCache ? "default" : "no-store") });
		if (!resp.ok)
		{
			console.warn("fetch() error for : " + path);
			return null;
		}
		let header_content_length = Number(resp.headers.get('content-length'));
		if (header_content_length > 0) RemoteDataUsage.RegisterBytesDownloaded(header_content_length);
		var obj = await resp.json();
		return obj;
	}

	async RefreshData()
	{
		if (this.waitingForData) return;
		this.waitingForData = true;
		await this.onRefreshData();
		this.waitingForData = false;
		this.afterRefreshData();
	}
}