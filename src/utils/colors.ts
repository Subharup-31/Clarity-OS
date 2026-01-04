
export const getIsDark = (hex: string): boolean => {
    if (!hex) return true;
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    // Perceptual brightness formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128; // Tweak threshold if needed
};

export const hexToRgba = (hex: string, opacity: number): string => {
    if (!hex) return `rgba(0,0,0,${opacity})`;

    // Handle short hex #FFF
    const fullHex = hex.length === 4
        ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
        : hex;

    const r = parseInt(fullHex.substring(1, 3), 16);
    const g = parseInt(fullHex.substring(3, 5), 16);
    const b = parseInt(fullHex.substring(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
