export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, unitIndex);

    // 根据单位调整小数位数
    const decimals = unitIndex === 0 ? 0 : unitIndex < 3 ? 2 : 1;
    return `${size.toFixed(decimals)} ${units[unitIndex]}`;
};
