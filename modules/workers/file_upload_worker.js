async function execute(upload_info)
{
    let contents = await upload_info.file.arrayBuffer();
    let result = await window.SharePoint.SetData(upload_info.url, contents, 'put', 'text/plain');
    postMessage(result);
}

onmessage = (e) =>
{
    execute(e.data);
};
