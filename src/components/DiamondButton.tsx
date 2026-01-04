import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SHADOW } from '../constants/tokens';

export const DiamondButton = ({ onPress }: { onPress: () => void }) => {
    const { colors, isDark } = useTheme();

    // Subtle pulse animation
    const pulseScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.3);
    const pressScale = useSharedValue(1);

    useEffect(() => {
        // Gentle breathing animation - smooth bidirectional
        pulseScale.value = withRepeat(
            withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true // This makes it reverse smoothly instead of jumping
        );

        glowOpacity.value = withRepeat(
            withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true // This makes it reverse smoothly instead of jumping
        );
    }, []);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        pressScale.value = withSequence(
            withSpring(0.9, { damping: 10 }),
            withSpring(1, { damping: 12 })
        );
        onPress();
    };

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }]
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: pulseScale.value * 1.2 }]
    }));

    const pressStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pressScale.value }]
    }));

    // Theme-adaptive shadow - use primary color on light themes to avoid black edges
    const adaptiveShadow = isDark ? SHADOW.lg : {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={styles.touchable}
            activeOpacity={1}
        >
            <View style={styles.diamondContainer}>
                {/* Glow effect */}
                <Animated.View style={[
                    styles.glow,
                    { backgroundColor: colors.primary },
                    glowStyle
                ]} />

                {/* Main diamond */}
                <Animated.View style={[
                    styles.diamond,
                    { backgroundColor: colors.primary },
                    adaptiveShadow,
                    pulseStyle,
                    pressStyle
                ]} />

                {/* Icon */}
                <Animated.View style={[styles.iconContainer, pressStyle]}>
                    <Plus color="#fff" size={28} strokeWidth={2.5} />
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    touchable: {
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    diamondContainer: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glow: {
        position: 'absolute',
        width: 56,
        height: 56,
        transform: [{ rotate: '45deg' }],
        borderRadius: 14,
    },
    diamond: {
        width: 52,
        height: 52,
        transform: [{ rotate: '45deg' }],
        borderRadius: 12,
    },
    iconContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    }
});
