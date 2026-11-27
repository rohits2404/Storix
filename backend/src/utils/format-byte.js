const BYTE_UNIT = 1024;

export const formatBytes = (bytes) => {
    bytes = Number(bytes) || 0;
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (bytes >= BYTE_UNIT && i < units.length - 1) {
        bytes /= BYTE_UNIT;
        i++;
    }
    return `${Number(bytes.toFixed(2))}${units[i]}`;
};
