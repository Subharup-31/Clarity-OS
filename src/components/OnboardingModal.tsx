import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useGame } from '../context/GameContext';
import { RADIUS, TEXT_STYLES, TOUCH } from '../constants/tokens';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface OnboardingModalProps {
    visible: boolean;
}

const SCREENS = [
    {
        title: 'Structure over motivation',
        body: 'This app enforces clarity and consistency — not hype or streak pressure.',
    },
    {
        title: 'How the system works',
        body: 'Dailies are non-negotiable rules.\nHabits shape behavior over time.\nTodos are one-off commitments.',
    },
    {
        title: 'Your day resets at 5 AM',
        body: 'Each new day starts at 5 AM — not midnight.\nThis means late-night work still counts for today.',
    },
    {
        title: 'Past days are read-only',
        body: 'You cannot edit or complete tasks for past dates.\nThis preserves the integrity of your history.',
    },
    {
        title: 'Earned flexibility',
        body: 'Consistency unlocks rest, rewards, and freedom — never guilt.',
    },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible }) => {
    const { colors } = useTheme();
    const { dispatch } = useGame();
    const [currentScreen, setCurrentScreen] = useState(0);

    const handleNext = () => {
        Haptics.selectionAsync();
        if (currentScreen < SCREENS.length - 1) {
            setCurrentScreen(currentScreen + 1);
        } else {
            // Complete onboarding
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dispatch({ type: 'COMPLETE_ONBOARDING' });
        }
    };

    const isLastScreen = currentScreen === SCREENS.length - 1;
    const screen = SCREENS[currentScreen];

    return (
        <Modal visible={visible} animationType="fade" statusBarTranslucent>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Progress Dots */}
                <View style={styles.dotsContainer}>
                    {SCREENS.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === currentScreen
                                        ? colors.primary
                                        : colors.border,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        {screen.title}
                    </Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]}>
                        {screen.body}
                    </Text>
                </View>

                {/* Action Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleNext}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {isLastScreen ? 'Get Started' : 'Continue'}
                        </Text>
                    </TouchableOpacity>

                    {/* Screen indicator */}
                    <Text style={[styles.indicator, { color: colors.textSecondary }]}>
                        {currentScreen + 1} of {SCREENS.length}
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingVertical: 60,
        justifyContent: 'space-between',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    title: {
        ...TEXT_STYLES.h1,
        fontFamily: 'Inter_700Bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    body: {
        ...TEXT_STYLES.body,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        minHeight: TOUCH.minTarget,
    },
    buttonText: {
        color: '#fff',
        ...TEXT_STYLES.button,
        fontFamily: 'Inter_600SemiBold',
    },
    indicator: {
        ...TEXT_STYLES.caption,
        fontFamily: 'Inter_400Regular',
    },
});
