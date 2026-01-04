import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    withSequence,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// PREMIUM PARTICLE TYPES
// ============================================
type AnimationType = 'fall' | 'rise' | 'rain' | 'wander' | 'sparkle' | 'drift' | 'aurora' | 'float' | 'pulse';
type ParticleShape = 'circle' | 'rect' | 'line' | 'glow' | 'orb';

interface ParticleConfig {
    count: number;
    type: AnimationType;
    shape: ParticleShape;
    colors: string[]; // Multiple colors for variety
    minSize: number;
    maxSize: number;
    minDur: number;
    maxDur: number;
    minOpacity: number;
    maxOpacity: number;
    blur?: number; // Glow effect
    layers?: number; // Depth layers
}

// ============================================
// HAND-CRAFTED PREMIUM PARTICLE
// ============================================
interface ParticleProps {
    config: ParticleConfig;
    startX: number;
    startY: number;
    delay: number;
    duration: number;
    size: number;
    color: string;
    layer: number;
    opacity: number;
}

const PremiumParticle: React.FC<ParticleProps> = ({
    config, startX, startY, delay, duration, size, color, layer, opacity: baseOpacity
}) => {
    const translateX = useSharedValue(startX);
    const translateY = useSharedValue(startY);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1);

    // Layer affects speed - background slower, foreground faster
    const layerMultiplier = 0.5 + (layer * 0.5);
    const adjustedDuration = duration / layerMultiplier;

    useEffect(() => {
        // Organic easing curves
        const easeInOutSine = Easing.bezier(0.37, 0, 0.63, 1);
        const easeOutQuart = Easing.bezier(0.25, 1, 0.5, 1);

        // ─────────────────────────────────────────
        // SPARKLE - Twinkling stars
        // ─────────────────────────────────────────
        if (config.type === 'sparkle') {
            const twinkleDuration = 1500 + Math.random() * 2000;
            opacity.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(baseOpacity, { duration: twinkleDuration * 0.4, easing: easeOutQuart }),
                        withTiming(baseOpacity * 0.3, { duration: twinkleDuration * 0.6, easing: easeInOutSine })
                    ),
                    -1, true)
            );
            scale.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(1.3, { duration: twinkleDuration * 0.4 }),
                        withTiming(0.8, { duration: twinkleDuration * 0.6 })
                    ),
                    -1, true)
            );
        }

        // ─────────────────────────────────────────
        // FLOAT - Gentle ambient floating (Zen, Nebula)
        // ─────────────────────────────────────────
        else if (config.type === 'float' || config.type === 'wander') {
            const wanderRange = 60 + Math.random() * 80;
            const wanderDuration = 6000 + Math.random() * 8000;

            opacity.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(baseOpacity, { duration: 3000, easing: easeOutQuart }),
                        withTiming(baseOpacity * 0.5, { duration: 4000, easing: easeInOutSine })
                    ),
                    -1, true)
            );

            translateX.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(startX + wanderRange, { duration: wanderDuration, easing: easeInOutSine }),
                        withTiming(startX - wanderRange * 0.7, { duration: wanderDuration * 1.2, easing: easeInOutSine })
                    ),
                    -1, true)
            );

            translateY.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(startY + wanderRange * 0.6, { duration: wanderDuration * 0.8, easing: easeInOutSine }),
                        withTiming(startY - wanderRange * 0.4, { duration: wanderDuration, easing: easeInOutSine })
                    ),
                    -1, true)
            );
        }

        // ─────────────────────────────────────────
        // AURORA - Northern lights waves
        // ─────────────────────────────────────────
        else if (config.type === 'aurora') {
            const waveAmplitude = 80 + Math.random() * 60;
            const waveDuration = 8000 + Math.random() * 6000;

            opacity.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(baseOpacity * 0.8, { duration: waveDuration * 0.3 }),
                        withTiming(baseOpacity, { duration: waveDuration * 0.4 }),
                        withTiming(baseOpacity * 0.4, { duration: waveDuration * 0.3 })
                    ),
                    -1, true)
            );

            // Horizontal wave motion
            translateX.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(startX + waveAmplitude, { duration: waveDuration, easing: Easing.inOut(Easing.sin) }),
                        withTiming(startX - waveAmplitude, { duration: waveDuration, easing: Easing.inOut(Easing.sin) })
                    ),
                    -1, false)
            );

            // Gentle vertical sway
            translateY.value = withDelay(delay,
                withRepeat(
                    withTiming(startY + 30, { duration: waveDuration * 0.7, easing: Easing.inOut(Easing.sin) }),
                    -1, true)
            );

            // Subtle scale breathing
            scale.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(1.2, { duration: waveDuration * 0.5 }),
                        withTiming(0.9, { duration: waveDuration * 0.5 })
                    ),
                    -1, true)
            );
        }

        // ─────────────────────────────────────────
        // DRIFT - Cherry blossoms, leaves
        // ─────────────────────────────────────────
        else if (config.type === 'drift') {
            const swayAmount = 40 + Math.random() * 60;
            const swayDuration = 3000 + Math.random() * 2000;

            opacity.value = withDelay(delay, withTiming(baseOpacity, { duration: 1000 }));

            // Falling with lateral sway
            const fallDuration = adjustedDuration;
            translateY.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(SCREEN_HEIGHT + 100, { duration: fallDuration, easing: Easing.linear }),
                        withTiming(-50, { duration: 0 })
                    ),
                    -1, false)
            );

            // Organic sway
            translateX.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(startX + swayAmount, { duration: swayDuration, easing: Easing.inOut(Easing.sin) }),
                        withTiming(startX - swayAmount, { duration: swayDuration, easing: Easing.inOut(Easing.sin) })
                    ),
                    -1, false)
            );

            // Gentle rotation effect via scale
            scale.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(1.1, { duration: swayDuration }),
                        withTiming(0.9, { duration: swayDuration })
                    ),
                    -1, true)
            );
        }

        // ─────────────────────────────────────────
        // RISE - Embers, bubbles, candle glow
        // ─────────────────────────────────────────
        else if (config.type === 'rise') {
            const riseWobble = 20 + Math.random() * 30;
            const wobbleDuration = 2000 + Math.random() * 2000;

            // Fade in, stay, fade out at top
            opacity.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(baseOpacity, { duration: adjustedDuration * 0.2 }),
                        withTiming(baseOpacity, { duration: adjustedDuration * 0.6 }),
                        withTiming(0, { duration: adjustedDuration * 0.2 })
                    ),
                    -1, false)
            );

            translateY.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(-100, { duration: adjustedDuration, easing: Easing.out(Easing.quad) }),
                        withTiming(SCREEN_HEIGHT + 50, { duration: 0 })
                    ),
                    -1, false)
            );

            translateX.value = withDelay(delay,
                withRepeat(
                    withTiming(startX + riseWobble * (Math.random() > 0.5 ? 1 : -1), {
                        duration: wobbleDuration,
                        easing: Easing.inOut(Easing.sin)
                    }),
                    -1, true)
            );

            // Shrink as they rise
            scale.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(1, { duration: adjustedDuration * 0.2 }),
                        withTiming(0.3, { duration: adjustedDuration * 0.8, easing: Easing.out(Easing.quad) })
                    ),
                    -1, false)
            );
        }

        // ─────────────────────────────────────────
        // RAIN - Fast falling lines
        // ─────────────────────────────────────────
        else if (config.type === 'rain') {
            opacity.value = withDelay(delay, withTiming(baseOpacity, { duration: 100 }));

            translateY.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(SCREEN_HEIGHT + 50, { duration: adjustedDuration, easing: Easing.linear }),
                        withTiming(-100, { duration: 0 })
                    ),
                    -1, false)
            );
        }

        // ─────────────────────────────────────────
        // FALL - Snow, gentle fall
        // ─────────────────────────────────────────
        else if (config.type === 'fall') {
            const swayAmount = 30 + Math.random() * 40;

            opacity.value = withDelay(delay, withTiming(baseOpacity, { duration: 1000 }));

            translateY.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(SCREEN_HEIGHT + 50, { duration: adjustedDuration, easing: Easing.linear }),
                        withTiming(-50, { duration: 0 })
                    ),
                    -1, false)
            );

            translateX.value = withDelay(delay,
                withRepeat(
                    withTiming(startX + swayAmount, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
                    -1, true)
            );
        }

        // ─────────────────────────────────────────
        // PULSE - Breathing glow (for orbs)
        // ─────────────────────────────────────────
        else if (config.type === 'pulse') {
            const pulseDuration = 3000 + Math.random() * 4000;

            opacity.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(baseOpacity, { duration: pulseDuration * 0.4 }),
                        withTiming(baseOpacity * 0.3, { duration: pulseDuration * 0.6 })
                    ),
                    -1, true)
            );

            scale.value = withDelay(delay,
                withRepeat(
                    withSequence(
                        withTiming(1.4, { duration: pulseDuration * 0.4, easing: Easing.out(Easing.quad) }),
                        withTiming(0.8, { duration: pulseDuration * 0.6, easing: Easing.in(Easing.quad) })
                    ),
                    -1, true)
            );
        }
    }, []);

    const style = useAnimatedStyle(() => {
        const isGlow = config.shape === 'glow' || config.shape === 'orb';
        const isLine = config.shape === 'line';

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value }
            ],
            opacity: opacity.value,
            width: isLine ? 2 : size,
            height: isLine ? size * 3 : size,
            borderRadius: config.shape === 'rect' ? 2 : size / 2,
            backgroundColor: color,
            // Glow effect using shadow
            ...(isGlow && {
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: size * 0.8,
            }),
        };
    });

    return <Animated.View style={[styles.particle, style]} />;
};

// ============================================
// THEME CONFIGURATIONS - Hand-Crafted
// ============================================
const getThemeConfig = (name: string): ParticleConfig | null => {
    switch (name) {
        // ─────── STANDARD ANIMATED ───────
        case 'starry_night': return {
            count: 50, type: 'sparkle', shape: 'glow',
            colors: ['#ffffff', '#fffacd', '#e0e0ff'],
            minSize: 2, maxSize: 4, minDur: 2000, maxDur: 5000,
            minOpacity: 0.4, maxOpacity: 1.0, layers: 3
        };
        case 'rain': return {
            count: 100, type: 'rain', shape: 'line',
            colors: ['#64B5F6', '#90CAF9', '#42A5F5'],
            minSize: 15, maxSize: 30, minDur: 400, maxDur: 700,
            minOpacity: 0.3, maxOpacity: 0.6, layers: 2
        };
        case 'snow_night': return {
            count: 60, type: 'fall', shape: 'circle',
            colors: ['#ffffff', '#f0f8ff', '#e8f4f8'],
            minSize: 3, maxSize: 6, minDur: 8000, maxDur: 15000,
            minOpacity: 0.5, maxOpacity: 0.9, layers: 3
        };
        case 'fireflies': return {
            count: 25, type: 'float', shape: 'glow',
            colors: ['#F4D03F', '#F7DC6F', '#FFF59D'],
            minSize: 4, maxSize: 8, minDur: 4000, maxDur: 8000,
            minOpacity: 0.4, maxOpacity: 0.9, layers: 2
        };
        case 'embers': return {
            count: 40, type: 'rise', shape: 'glow',
            colors: ['#E74C3C', '#FF6B35', '#FFA500'],
            minSize: 3, maxSize: 6, minDur: 3000, maxDur: 6000,
            minOpacity: 0.5, maxOpacity: 1.0, layers: 3
        };
        case 'bubbles': return {
            count: 25, type: 'rise', shape: 'orb',
            colors: ['rgba(255,255,255,0.3)', 'rgba(200,230,255,0.4)', 'rgba(180,220,255,0.3)'],
            minSize: 8, maxSize: 20, minDur: 6000, maxDur: 12000,
            minOpacity: 0.2, maxOpacity: 0.5, layers: 3
        };
        case 'blossom': return {
            count: 30, type: 'drift', shape: 'circle',
            colors: ['#FFB7B2', '#FFDAC1', '#FFE5E5', '#FFC0CB'],
            minSize: 5, maxSize: 10, minDur: 8000, maxDur: 15000,
            minOpacity: 0.5, maxOpacity: 0.9, layers: 3
        };
        case 'cosmos': return {
            count: 60, type: 'sparkle', shape: 'glow',
            colors: ['#A569BD', '#8E44AD', '#D7BDE2', '#ffffff'],
            minSize: 2, maxSize: 5, minDur: 2000, maxDur: 6000,
            minOpacity: 0.3, maxOpacity: 1.0, layers: 3
        };
        case 'gold_dust': return {
            count: 60, type: 'drift', shape: 'glow',
            colors: ['#FFD700', '#FFC107', '#FFEB3B', '#FFF8E1'],
            minSize: 2, maxSize: 4, minDur: 5000, maxDur: 10000,
            minOpacity: 0.4, maxOpacity: 0.9, layers: 3
        };
        case 'leaf_fall': return {
            count: 20, type: 'drift', shape: 'rect',
            colors: ['#E67E22', '#D35400', '#F39C12', '#C0392B'],
            minSize: 6, maxSize: 12, minDur: 6000, maxDur: 12000,
            minOpacity: 0.6, maxOpacity: 0.9, layers: 3
        };
        case 'ink': return {
            count: 40, type: 'drift', shape: 'circle',
            colors: ['#38bdf8', '#0ea5e9', '#7dd3fc'],
            minSize: 3, maxSize: 6, minDur: 5000, maxDur: 10000,
            minOpacity: 0.3, maxOpacity: 0.7, layers: 2
        };
        case 'shimmer': return {
            count: 40, type: 'sparkle', shape: 'glow',
            colors: ['#ffffff', '#f8f8f8', '#eeeeee'],
            minSize: 2, maxSize: 5, minDur: 400, maxDur: 1500,
            minOpacity: 0.3, maxOpacity: 1.0, layers: 2
        };

        // ─────── PREMIUM ANIMATED (Hand-Crafted) ───────
        case 'aurora': return {
            count: 25, type: 'aurora', shape: 'orb',
            colors: ['#00d4aa', '#00e5c9', '#00ffbb', '#00b396', '#40e0d0'],
            minSize: 15, maxSize: 35, minDur: 8000, maxDur: 15000,
            minOpacity: 0.15, maxOpacity: 0.4, layers: 3
        };
        case 'sakura': return {
            count: 35, type: 'drift', shape: 'circle',
            colors: ['#ff9eb5', '#ffc0cb', '#ffb6c1', '#ffdae0', '#fff0f5'],
            minSize: 5, maxSize: 12, minDur: 8000, maxDur: 16000,
            minOpacity: 0.5, maxOpacity: 0.9, layers: 3
        };
        case 'nebula': return {
            count: 20, type: 'float', shape: 'orb',
            colors: ['#9d4edd', '#7b2cbf', '#c77dff', '#e0aaff', '#5a189a'],
            minSize: 20, maxSize: 50, minDur: 10000, maxDur: 20000,
            minOpacity: 0.1, maxOpacity: 0.3, layers: 3
        };
        case 'underwater': return {
            count: 40, type: 'rise', shape: 'orb',
            colors: ['#00c8ff', '#00a8e8', '#48cae4', '#90e0ef', '#caf0f8'],
            minSize: 6, maxSize: 18, minDur: 5000, maxDur: 12000,
            minOpacity: 0.2, maxOpacity: 0.6, layers: 3
        };
        case 'volcanic': return {
            count: 50, type: 'rise', shape: 'glow',
            colors: ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ff2200'],
            minSize: 3, maxSize: 8, minDur: 2000, maxDur: 5000,
            minOpacity: 0.5, maxOpacity: 1.0, layers: 3
        };
        case 'zen': return {
            count: 15, type: 'float', shape: 'orb',
            colors: ['#7db87d', '#90c090', '#a0d0a0', '#b0e0b0'],
            minSize: 8, maxSize: 20, minDur: 12000, maxDur: 25000,
            minOpacity: 0.15, maxOpacity: 0.4, layers: 2
        };
        case 'midnight_oil': return {
            count: 40, type: 'sparkle', shape: 'glow',
            colors: ['#4a90d9', '#5a9fe9', '#3a80c9', '#6aafff'],
            minSize: 2, maxSize: 5, minDur: 2000, maxDur: 6000,
            minOpacity: 0.3, maxOpacity: 0.8, layers: 3
        };
        case 'candlelight': return {
            count: 30, type: 'rise', shape: 'glow',
            colors: ['#ffaa44', '#ffcc66', '#ffdd88', '#ff9922', '#ffeebb'],
            minSize: 4, maxSize: 10, minDur: 4000, maxDur: 9000,
            minOpacity: 0.4, maxOpacity: 0.9, layers: 3
        };

        // ─────── POP CULTURE ───────
        case 'spider_2099': return {
            count: 25, type: 'rise', shape: 'line',
            colors: ['#FF3F34', '#ff0000', '#ff6666'],
            minSize: 10, maxSize: 25, minDur: 200, maxDur: 800,
            minOpacity: 0.4, maxOpacity: 0.8, layers: 2
        };
        case 'deadpool': return {
            count: 25, type: 'fall', shape: 'circle',
            colors: ['#FF0000', '#cc0000', '#ff3333', '#990000'],
            minSize: 4, maxSize: 8, minDur: 5000, maxDur: 10000,
            minOpacity: 0.3, maxOpacity: 0.7, layers: 3
        };
        case 'witcher': return {
            count: 35, type: 'float', shape: 'glow',
            colors: ['#c0c0c0', '#d0d0d0', '#e0e0e0', '#b0b0b0'],
            minSize: 2, maxSize: 5, minDur: 3000, maxDur: 7000,
            minOpacity: 0.3, maxOpacity: 0.7, layers: 3
        };
        case 'dune': return {
            count: 80, type: 'drift', shape: 'circle',
            colors: ['#d4a574', '#e6c8a8', '#c4956a', '#b48554'],
            minSize: 1, maxSize: 3, minDur: 4000, maxDur: 8000,
            minOpacity: 0.3, maxOpacity: 0.6, layers: 2
        };
        case 'tanjiro': return {
            count: 40, type: 'float', shape: 'rect',
            colors: ['#00b894', '#55efc4', '#00cec9', '#81ecec'],
            minSize: 3, maxSize: 8, minDur: 4000, maxDur: 8000,
            minOpacity: 0.2, maxOpacity: 0.5, layers: 3
        };
        case 'eva_unit': return {
            count: 50, type: 'fall', shape: 'rect',
            colors: ['#00b894', '#2ECC71', '#55efc4'],
            minSize: 2, maxSize: 4, minDur: 2000, maxDur: 4000,
            minOpacity: 0.3, maxOpacity: 0.6, layers: 2
        };

        // ─────── ANIMATED LIGHT THEMES ───────
        case 'sunbeam': return {
            count: 40, type: 'float', shape: 'glow',
            colors: ['#ffd700', '#ffcc00', '#ffaa00', '#ff9500'],
            minSize: 6, maxSize: 15, minDur: 5000, maxDur: 12000,
            minOpacity: 0.2, maxOpacity: 0.5, layers: 3
        };
        case 'daydream': return {
            count: 20, type: 'float', shape: 'orb',
            colors: ['#87ceeb', '#add8e6', '#b0e0e6', '#e0f0ff'],
            minSize: 20, maxSize: 50, minDur: 10000, maxDur: 20000,
            minOpacity: 0.1, maxOpacity: 0.3, layers: 3
        };
        case 'cotton_candy': return {
            count: 35, type: 'drift', shape: 'circle',
            colors: ['#ffb6c1', '#ffc0cb', '#add8e6', '#e6e6fa'],
            minSize: 8, maxSize: 18, minDur: 8000, maxDur: 16000,
            minOpacity: 0.3, maxOpacity: 0.6, layers: 3
        };
        case 'spring_rain': return {
            count: 60, type: 'fall', shape: 'circle',
            colors: ['#90ee90', '#98fb98', '#a0d0a0', '#c0e8c0'],
            minSize: 3, maxSize: 6, minDur: 6000, maxDur: 12000,
            minOpacity: 0.3, maxOpacity: 0.6, layers: 3
        };
        case 'sparkle': return {
            count: 50, type: 'sparkle', shape: 'glow',
            colors: ['#dda0dd', '#da70d6', '#ba55d3', '#e6e6fa'],
            minSize: 3, maxSize: 8, minDur: 1000, maxDur: 3000,
            minOpacity: 0.4, maxOpacity: 0.9, layers: 3
        };
        case 'morning_mist': return {
            count: 15, type: 'float', shape: 'orb',
            colors: ['#d0d0d0', '#c0c0c0', '#e0e0e0', '#b0b0b0'],
            minSize: 30, maxSize: 70, minDur: 15000, maxDur: 30000,
            minOpacity: 0.05, maxOpacity: 0.15, layers: 2
        };

        default: return null;
    }
};

// ============================================
// MAIN COMPONENT
// ============================================
export const AnimatedBackground = ({ children }: { children: React.ReactNode }) => {
    const { themeName, colors } = useTheme();
    const config = getThemeConfig(themeName);

    // Generate particles with variety
    const particles = useMemo(() => {
        if (!config) return [];

        const layers = config.layers || 2;
        const particlesPerLayer = Math.ceil(config.count / layers);

        return Array.from({ length: config.count }).map((_, i) => {
            const layer = Math.floor(i / particlesPerLayer); // 0, 1, 2...
            const colorIndex = Math.floor(Math.random() * config.colors.length);
            const sizeRange = config.maxSize - config.minSize;
            const opacityRange = config.maxOpacity - config.minOpacity;

            // Layer affects size and opacity (background = smaller, more transparent)
            const layerFactor = (layers - layer) / layers;

            return {
                id: i,
                startX: Math.random() * SCREEN_WIDTH,
                startY: Math.random() * SCREEN_HEIGHT,
                delay: Math.random() * 5000,
                duration: config.minDur + Math.random() * (config.maxDur - config.minDur),
                size: config.minSize + (sizeRange * (0.5 + layerFactor * 0.5)) * Math.random(),
                color: config.colors[colorIndex],
                layer,
                opacity: config.minOpacity + (opacityRange * layerFactor * Math.random()),
            };
        });
    }, [themeName, config]);

    if (!config) {
        return <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {particles.map(p => (
                <PremiumParticle
                    key={`${themeName}-${p.id}`}
                    config={config}
                    startX={p.startX}
                    startY={p.startY}
                    delay={p.delay}
                    duration={p.duration}
                    size={p.size}
                    color={p.color}
                    layer={p.layer}
                    opacity={p.opacity}
                />
            ))}
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
    },
});
