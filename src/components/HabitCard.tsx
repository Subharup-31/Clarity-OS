import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Habit } from '../types';
import { Zap, Plus, Minus } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RADIUS, SHADOW, TEXT_STYLES, TOUCH } from '../constants/tokens';

interface HabitCardProps {
    habit: Habit;
    onPositive: () => void;
    onNegative: () => void;
    disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onPositive, onNegative, disabled = false }) => {
    const { colors } = useTheme();

    // Animation values
    const positiveScale = useSharedValue(1);
    const negativeScale = useSharedValue(1);
    const cardScale = useSharedValue(1);

    const handlePositive = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        positiveScale.value = withSequence(
            withSpring(0.85, { damping: 10 }),
            withSpring(1.1, { damping: 8 }),
            withSpring(1, { damping: 12 })
        );
        cardScale.value = withSequence(
            withSpring(1.02, { damping: 15 }),
            withSpring(1, { damping: 12 })
        );
        onPositive();
    };

    const handleNegative = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        negativeScale.value = withSequence(
            withSpring(0.85, { damping: 10 }),
            withSpring(1.1, { damping: 8 }),
            withSpring(1, { damping: 12 })
        );
        onNegative();
    };

    const positiveStyle = useAnimatedStyle(() => ({
        transform: [{ scale: positiveScale.value }]
    }));

    const negativeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: negativeScale.value }]
    }));

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }]
    }));

    return (
        <Animated.View style={[
            styles.container,
            { backgroundColor: colors.cardBg },
            SHADOW.sm,
            cardStyle,
            disabled && styles.disabledContainer
        ]}>
            {/* Left: Icon Box */}
            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                <Zap color={colors.primary} size={22} />
            </View>

            {/* Middle: Content */}
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                    {habit.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {habit.strength > 0 ? `${habit.strength} day streak` : 'Start your streak'}
                </Text>
            </View>

            {/* Right: Actions */}
            <View style={styles.actions}>
                {/* Negative counter */}
                <View style={styles.counterGroup}>
                    <AnimatedTouchable
                        onPress={handleNegative}
                        style={[styles.actionBtn, { backgroundColor: colors.negative + '20' }, negativeStyle]}
                        activeOpacity={0.7}
                    >
                        <Minus color={colors.negative} size={18} strokeWidth={2.5} />
                    </AnimatedTouchable>
                    <Text style={[styles.score, { color: colors.negative }]}>
                        {habit.countNegative}
                    </Text>
                </View>

                {/* Positive counter */}
                <View style={styles.counterGroup}>
                    <Text style={[styles.score, { color: colors.positive }]}>
                        {habit.countPositive}
                    </Text>
                    <AnimatedTouchable
                        onPress={handlePositive}
                        style={[styles.actionBtn, { backgroundColor: colors.positive + '20' }, positiveStyle]}
                        activeOpacity={0.7}
                    >
                        <Plus color={colors.positive} size={18} strokeWidth={2.5} />
                    </AnimatedTouchable>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: RADIUS.md,
        marginBottom: 10,
        minHeight: 72,
    },
    disabledContainer: {
        opacity: 0.5,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
    },
    title: {
        ...TEXT_STYLES.bodyBold,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 2,
    },
    subtitle: {
        ...TEXT_STYLES.caption,
        fontFamily: 'Inter_400Regular',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    counterGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionBtn: {
        width: TOUCH.minTarget,
        height: TOUCH.minTarget,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    score: {
        ...TEXT_STYLES.bodyBold,
        fontFamily: 'Inter_700Bold',
        minWidth: 20,
        textAlign: 'center',
    }
});
