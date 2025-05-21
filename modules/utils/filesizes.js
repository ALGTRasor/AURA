export const bytes_kb = 1024;
export const bytes_mb = bytes_kb * 1024;
export const bytes_gb = bytes_mb * 1024;
export const bytes_tb = bytes_gb * 1024;

export const file_size_groups = [
    { base_bytes: 1, suffix: 'bytes', color: undefined },
    { base_bytes: bytes_kb, suffix: 'KB', color: undefined },
    { base_bytes: bytes_mb, suffix: 'MB', color: '#ff0' },
    { base_bytes: bytes_gb, suffix: 'GB', color: '#f00' },
    { base_bytes: bytes_tb, suffix: 'TB', color: '#f00' }
];

export const get_file_size_group = (bytes) =>
{
    let group = null;
    for (let gid in file_size_groups)
    {
        let next_group = file_size_groups[gid];
        if (gid > 0 && bytes < next_group.base_bytes) break;
        group = next_group;
    }
    group.bytes = (bytes / group.base_bytes).toFixed(2);
    group.bytes_label = group.bytes + ' ' + group.suffix;
    return group;
}