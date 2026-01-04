import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useGame } from '../context/GameContext';
import { ChevronDown, ChevronUp, Coins, Diamond } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming, useSharedValue } from 'react-native-reanimated';
import { SettingsModal } from './SettingsModal';
import { NameEditModal } from './NameEditModal';
import { RADIUS, SHADOW, TEXT_STYLES } from '../constants/tokens';
import * as Haptics from 'expo-haptics';

export const TopBar = () => {
    const { state, dispatch } = useGame();
    const { user } = state;
    const { colors, spacing } = useTheme();
    const insets = useSafeAreaInsets();
    const [showSettings, setShowSettings] = useState(false);
    const [showNameEdit, setShowNameEdit] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Calculate percentages
    const hpPercent = (user.hp / user.maxHp) * 100;
    const xpPercent = (user.xp / user.maxXp) * 100;

    const hpStyle = useAnimatedStyle(() => ({
        width: withSpring(`${hpPercent}%`, { damping: 20, stiffness: 90 }),
    }));

    const xpStyle = useAnimatedStyle(() => ({
        width: withSpring(`${xpPercent}%`, { damping: 20, stiffness: 90 }),
    }));

    const toggleExpand = () => {
        Haptics.selectionAsync();
        setExpanded(!expanded);
    };

    return (
        <View style={[styles.container, { backgroundColor: (colors as any).headerBg || colors.cardBg, paddingTop: insets.top }]}>
            <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />

            {/* Main Row */}
            <View style={[styles.topRow, { paddingHorizontal: spacing.m }]}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => setShowNameEdit(true)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
                        <Image
                            source={{ uri: `https://api.dicebear.com/7.x/pixel-art/png?seed=${user.avatarId}` }}
                            style={styles.avatar}
                        />
                        <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.levelText}>{user.level}</Text>
                        </View>
                    </View>
                    <View>
                        <Text style={[styles.username, { color: colors.textPrimary }]}>
                            {user.name || 'Player One'}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Level {user.level} Hero
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Compact Currency + Expand Toggle */}
                <TouchableOpacity
                    style={[styles.currencyPill, { backgroundColor: colors.background }]}
                    onPress={toggleExpand}
                    activeOpacity={0.8}
                >
                    <View style={styles.currencyItem}>
                        <Coins color={colors.gold} size={16} />
                        <Text style={[styles.currencyText, { color: colors.gold }]}>{user.gold}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.currencyItem}>
                        <Diamond color={colors.primary} size={14} />
                        <Text style={[styles.currencyText, { color: colors.primary }]}>{user.gems}</Text>
                    </View>
                    {expanded ?
                        <ChevronUp color={colors.textSecondary} size={16} style={{ marginLeft: 4 }} /> :
                        <ChevronDown color={colors.textSecondary} size={16} style={{ marginLeft: 4 }} />
                    }
                </TouchableOpacity>
            </View>

            {/* Stats Row - Always visible */}
            <View style={[styles.statsContainer, { paddingHorizontal: spacing.m }]}>
                {/* HP Bar */}
                <View style={styles.barWrapper}>
                    <View style={styles.barLabelRow}>
                        <Text style={[styles.barLabel, { color: colors.health }]}>HP</Text>
                        <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                            {Math.ceil(user.hp)}/{user.maxHp}
                        </Text>
                    </View>
                    <View style={[styles.barBackground, { backgroundColor: colors.healthBg }]}>
                        <Animated.View style={[styles.barFill, { backgroundColor: colors.health }, hpStyle]} />
                    </View>
                </View>

                {/* XP Bar */}
                <View style={styles.barWrapper}>
                    <View style={styles.barLabelRow}>
                        <Text style={[styles.barLabel, { color: colors.xp }]}>XP</Text>
                        <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                            {Math.floor(user.xp)}/{user.maxXp}
                        </Text>
                    </View>
                    <View style={[styles.barBackground, { backgroundColor: colors.xpBg }]}>
                        <Animated.View style={[styles.barFill, { backgroundColor: colors.xp }, xpStyle]} />
                    </View>
                </View>
            </View>

            {/* Expanded Details (Optional) */}
            {expanded && (
                <View style={[styles.expandedDetails, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Gold Multiplier</Text>
                        <Text style={[styles.detailValue, { color: colors.gold }]}>
                            {((user.goldMultiplier || 1) * 100).toFixed(0)}%
                        </Text>
                    </View>
                    {(user.streakShields || 0) > 0 && (
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Streak Shields</Text>
                            <Text style={[styles.detailValue, { color: colors.primary }]}>🛡️ {user.streakShields}</Text>
                        </View>
                    )}
                </View>
            )}

            <NameEditModal
                visible={showNameEdit}
                currentName={user.name || 'Player One'}
                onClose={() => setShowNameEdit(false)}
                onSave={(name) => dispatch({ type: 'SET_NAME', payload: name })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 12,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    levelText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    username: {
        ...TEXT_STYLES.bodyBold,
        fontFamily: 'Inter_600SemiBold',
    },
    subtitle: {
        ...TEXT_STYLES.caption,
        fontFamily: 'Inter_400Regular',
    },
    currencyPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: RADIUS.lg,
        gap: 8,
    },
    currencyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    currencyText: {
        ...TEXT_STYLES.captionBold,
        fontFamily: 'Inter_600SemiBold',
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statsContainer: {
        gap: 6,
    },
    barWrapper: {
        marginBottom: 2,
    },
    barLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    barLabel: {
        ...TEXT_STYLES.label,
        fontFamily: 'Inter_600SemiBold',
    },
    barValue: {
        ...TEXT_STYLES.caption,
        fontFamily: 'Inter_400Regular',
    },
    barBackground: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    expandedDetails: {
        marginTop: 8,
        marginHorizontal: 16,
        padding: 12,
        borderRadius: RADIUS.md,
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        ...TEXT_STYLES.caption,
        fontFamily: 'Inter_400Regular',
        marginBottom: 2,
    },
    detailValue: {
        ...TEXT_STYLES.bodyBold,
        fontFamily: 'Inter_700Bold',
    },
});
