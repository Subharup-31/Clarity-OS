import { useGame } from '../context/GameContext';
import { PALETTES, COMMON, SPACING, SIZES } from '../constants/theme';
import { getIsDark, hexToRgba } from '../utils/colors';

export const useTheme = () => {
    const { state } = useGame();
    const currentTheme = state.user.theme || 'dark';    // Force Solid Logic for now
    const opacity = 1.0;

    const baseColors = PALETTES[currentTheme] || PALETTES.dark;
    const isDarkBg = getIsDark(baseColors.background);

    // Derived Colors (Always Solid)
    const widgetBg = hexToRgba(baseColors.cardBg, opacity);
    const navBg = hexToRgba((baseColors as any).navBg || baseColors.cardBg, opacity);
    const headerBg = hexToRgba((baseColors as any).headerBg || baseColors.cardBg, opacity);

    // Alerts always solid
    const alertCardBg = hexToRgba(baseColors.cardBg, opacity);


    return {
        colors: {
            ...baseColors,
            cardBg: widgetBg,
            navBg,
            headerBg,
            alertCardBg,
            solidCardBg: baseColors.cardBg,
            ...COMMON,
        } as any, // Cast to any to allow dynamic properties
        spacing: SPACING,
        sizes: SIZES,
        themeName: currentTheme,
        isDark: isDarkBg,
        statusBarStyle: isDarkBg ? 'light' : 'dark' as 'light' | 'dark',
    };
};
