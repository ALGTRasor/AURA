export const bytes_kb = 1024;
export const bytes_mb = bytes_kb * 1024;
export const bytes_gb = bytes_mb * 1024;

export const file_size_groups = [
    { base_bytes: 1, suffix: 'bytes', color: undefined },
    { base_bytes: bytes_kb, suffix: 'KB', color: undefined },
    { base_bytes: bytes_mb, suffix: 'MB', color: '#ff0' },
    { base_bytes: bytes_gb, suffix: 'GB', color: '#f00' }
];

export const get_file_size_group = (bytes) =>
{
    let group = undefined;
    if (bytes < bytes_kb) group = file_size_groups[0];
    else if (bytes < bytes_mb) group = file_size_groups[1];
    else if (bytes < bytes_gb) group = file_size_groups[2];
    else group = file_size_groups[3];
    group.bytes = (bytes / group.base_bytes).toFixed(2);
    group.bytes_label = group.bytes + ' ' + group.suffix;
    return group;
}