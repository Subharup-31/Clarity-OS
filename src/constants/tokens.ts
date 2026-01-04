// Design Tokens — Single source of truth for all UI styles
// Based on premium UI/UX audit recommendations

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const SHADOW = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
};

export const TYPOGRAPHY = {
    // Font weights mapped to Inter variants
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    // Type scale
    fontSize: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 20,
        xl: 24,
        '2xl': 32,
    },
    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
    // Letter spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
    },
};

// Pre-composed text styles for consistency
export const TEXT_STYLES = {
    h1: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        lineHeight: TYPOGRAPHY.fontSize.xl * TYPOGRAPHY.lineHeight.tight,
    },
    h2: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        lineHeight: TYPOGRAPHY.fontSize.lg * TYPOGRAPHY.lineHeight.tight,
    },
    h3: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        lineHeight: TYPOGRAPHY.fontSize.md * TYPOGRAPHY.lineHeight.normal,
    },
    body: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.regular,
        lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.normal,
    },
    bodyBold: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.normal,
    },
    caption: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.regular,
        lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal,
    },
    captionBold: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
        textTransform: 'uppercase' as const,
    },
    button: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
};

// Touch target sizes (Apple HIG minimum: 44px)
export const TOUCH = {
    minTarget: 44,
    smallTarget: 32, // Only for dense UI with clear affordances
};

// Animation timing
export const ANIMATION = {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
        damping: 15,
        stiffness: 150,
        mass: 1,
    },
};
