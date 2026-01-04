import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Daily, Todo } from '../types';
import { Check, Calendar } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RADIUS, SHADOW, TEXT_STYLES, TOUCH } from '../constants/tokens';

interface TaskCardProps {
    task: Daily | Todo;
    onToggle: () => void;
    onReschedule?: () => void;
    disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onReschedule, disabled = false }) => {
    const { colors } = useTheme();
    const isCompleted = task.completed;
    const isDaily = task.type === 'daily';
    const accentColor = isDaily ? colors.neutral : colors.xp;

    // Animation values
    const checkScale = useSharedValue(1);
    const cardScale = useSharedValue(1);

    const handleToggle = () => {
        if (disabled) return;
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Animate checkbox
        checkScale.value = withSequence(
            withSpring(0.8, { damping: 10 }),
            withSpring(1.15, { damping: 8 }),
            withSpring(1, { damping: 12 })
        );

        // Animate card
        cardScale.value = withSequence(
            withTiming(0.98, { duration: 100 }),
            withSpring(1, { damping: 15 })
        );

        onToggle();
    };

    const checkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }]
    }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }]
    }));

    return (
        <Animated.View style={[
            styles.card,
            { backgroundColor: colors.cardBg },
            SHADOW.sm,
            isCompleted && styles.cardCompleted,
            cardAnimatedStyle,
            disabled && { opacity: 0.5 }
        ]}>
            <AnimatedTouchable
                style={[
                    styles.checkBtn,
                    {
                        backgroundColor: isCompleted ? accentColor : 'transparent',
                        borderColor: accentColor
                    },
                    checkAnimatedStyle
                ]}
                onPress={handleToggle}
                activeOpacity={0.8}
            >
                {isCompleted && <Check color={colors.cardBg} size={18} strokeWidth={3} />}
            </AnimatedTouchable>

            <View style={styles.content}>
                <Text style={[
                    styles.title,
                    { color: colors.textPrimary },
                    isCompleted && styles.textCompleted
                ]}>
                    {task.title}
                </Text>
                {task.notes && (
                    <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={1}>
                        {task.notes}
                    </Text>
                )}
            </View>

            {/* Reschedule count badge for Todos */}
            {!isDaily && (task as any).rescheduleCount > 0 && (
                <View style={[styles.rescheduleBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.rescheduleBadgeText, { color: colors.primary }]}>
                        {(task as any).rescheduleCount}x
                    </Text>
                </View>
            )}

            {/* Reschedule button for Todos only */}
            {!isDaily && !isCompleted && onReschedule && (
                <TouchableOpacity
                    onPress={() => {
                        Haptics.selectionAsync();
                        onReschedule();
                    }}
                    style={styles.rescheduleBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Calendar color={colors.primary} size={20} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        borderRadius: RADIUS.md,
        padding: 14,
        marginBottom: 10,
        alignItems: 'center',
        minHeight: 56,
    },
    cardCompleted: {
        opacity: 0.6,
    },
    checkBtn: {
        width: 28,
        height: 28,
        borderRadius: RADIUS.sm,
        borderWidth: 2.5,
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
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.7,
    },
    notes: {
        ...TEXT_STYLES.caption,
        fontFamily: 'Inter_400Regular',
        marginTop: 2,
    },
    rescheduleBtn: {
        padding: 10,
        marginLeft: 8,
        minWidth: TOUCH.minTarget,
        minHeight: TOUCH.minTarget,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rescheduleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
        marginRight: 8,
    },
    rescheduleBadgeText: {
        fontSize: 11,
        fontFamily: 'Inter_600SemiBold',
        fontWeight: '600',
    }
});
