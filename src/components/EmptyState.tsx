import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Plus, Zap, CheckCircle, Target } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { RADIUS, TEXT_STYLES } from '../constants/tokens';

interface EmptyStateProps {
    type: 'habit' | 'daily' | 'todo';
    onAdd?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAdd }) => {
    const { colors } = useTheme();

    const floatY = useSharedValue(0);

    React.useEffect(() => {
        floatY.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
    }, []);

    const floatStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatY.value }]
    }));

    const config = {
        habit: {
            icon: Zap,
            title: 'No habits yet',
            subtitle: 'Build powerful routines that stick',
            action: 'Create Your First Habit',
        },
        daily: {
            icon: CheckCircle,
            title: 'All done for today!',
            subtitle: 'Enjoy your free time or add more dailies',
            action: 'Add a Daily',
        },
        todo: {
            icon: Target,
            title: 'Quest log empty',
            subtitle: 'Start conquering your goals',
            action: 'Start a New Quest',
        },
    };

    const { icon: Icon, title, subtitle, action } = config[type];

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + '15' },
                floatStyle
            ]}>
                <Icon color={colors.primary} size={48} strokeWidth={1.5} />
            </Animated.View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

            {onAdd && (
                <TouchableOpacity
                    style={[styles.addBtn, { borderColor: colors.primary }]}
                    onPress={onAdd}
                    activeOpacity={0.7}
                >
                    <Plus color={colors.primary} size={18} />
                    <Text style={[styles.addBtnText, { color: colors.primary }]}>{action}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: 400,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 16, // Prevent clipping during float animation
    },
    title: {
        ...TEXT_STYLES.h2,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        ...TEXT_STYLES.body,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        marginBottom: 32,
        opacity: 0.8,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        gap: 8,
    },
    addBtnText: {
        ...TEXT_STYLES.button,
        fontFamily: 'Inter_600SemiBold',
    },
});
