import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { useTheme } from '../hooks/useTheme';
import { useAlert } from '../context/AlertContext';
import { X, Lock, Plus, ChevronDown, ChevronUp, Shield, Coins, Diamond, Award, Coffee, Gift, Zap } from 'lucide-react-native';
import { ShopItem } from '../types';
import { RADIUS, TEXT_STYLES } from '../constants/tokens';
import * as Haptics from 'expo-haptics';

interface ShopModalProps {
    visible: boolean;
    onClose: () => void;
}

// ============================================
// REWARD DATA — Calm, Intentional Copy
// ============================================
const REWARDS = {
    daily: {
        title: 'Daily Comforts',
        philosophy: 'Small moments of rest earned through consistent effort.',
        rules: 'Limit: 2 per day',
        icon: Coffee,
        items: [
            { id: 'd1', name: 'Screen Break (30 min)', cost: 25, currency: 'gold' as const, category: 'Daily Comforts' },
            { id: 'd2', name: 'Quality Coffee', cost: 30, currency: 'gold' as const, category: 'Daily Comforts' },
            { id: 'd3', name: 'One Episode', cost: 20, currency: 'gold' as const, category: 'Daily Comforts' },
            { id: 'd4', name: 'Music Session', cost: 15, currency: 'gold' as const, category: 'Daily Comforts' },
            { id: 'd5', name: 'Sweet Treat', cost: 40, currency: 'gold' as const, category: 'Daily Comforts' },
        ],
    },
    weekly: {
        title: 'Weekly Rituals',
        philosophy: 'Meaningful rewards that mark a week well spent.',
        rules: 'Limit: 1 per week',
        icon: Gift,
        items: [
            { id: 'w1', name: 'Movie Night', cost: 150, currency: 'gold' as const, category: 'Weekly Joys' },
            { id: 'w2', name: 'Dining Experience', cost: 200, currency: 'gold' as const, category: 'Weekly Joys' },
            { id: 'w3', name: 'Extra Sleep (Weekend)', cost: 100, currency: 'gold' as const, category: 'Weekly Joys' },
            { id: 'w4', name: 'Digital Purchase', cost: 125, currency: 'gold' as const, category: 'Weekly Joys' },
        ],
    },
    recovery: {
        title: 'Recovery Permits',
        philosophy: 'Permission to rest without guilt. Earned, never stolen.',
        rules: 'Requires: System Trust Level',
        icon: Shield,
        requiresUnlock: true,
        items: [
            { id: 'p1', name: 'Full Recovery Day', cost: 500, currency: 'gold' as const, category: 'Permission Rewards' },
            { id: 'p2', name: 'Mental Reset', cost: 300, currency: 'gold' as const, category: 'Permission Rewards' },
            { id: 'p3', name: 'Task Deferral', cost: 75, currency: 'gold' as const, category: 'Permission Rewards' },
        ],
    },
    milestone: {
        title: 'Milestones',
        philosophy: 'Major rewards for sustained excellence. Worth waiting for.',
        rules: 'Requires: Streak Unlock',
        icon: Award,
        requiresUnlock: true,
        items: [
            // Tier 1: Accessible Milestones
            { id: 'm1', name: 'Quality Gear', cost: 1500, currency: 'gold' as const, category: 'Milestones' },
            { id: 'm2', name: 'Tech Upgrade', cost: 2000, currency: 'gold' as const, category: 'Milestones' },
            { id: 'm3', name: 'Spa / Wellness Day', cost: 2500, currency: 'gold' as const, category: 'Milestones' },
            // Tier 2: Premium Milestones
            { id: 'm4', name: 'Concert / Event Tickets', cost: 3000, currency: 'gold' as const, category: 'Milestones' },
            { id: 'm5', name: 'Gaming Console / Tech', cost: 4000, currency: 'gold' as const, category: 'Milestones' },
            { id: 'm6', name: 'Experience Trip', cost: 5000, currency: 'gold' as const, category: 'Milestones' },
            // Tier 3: Aspirational Milestones
            { id: 'm7', name: 'Hobby Investment', cost: 7500, currency: 'gold' as const, category: 'Milestones' },
            { id: 'm8', name: 'Weekend Getaway', cost: 10000, currency: 'gold' as const, category: 'Milestones' },
            { id: 'm9', name: 'Fine Dining Experience', cost: 12500, currency: 'gold' as const, category: 'Milestones' },
            { id: 'm10', name: 'Luxury Purchase', cost: 25000, currency: 'gold' as const, category: 'Milestones' },
        ],
    },
    system: {
        title: 'System Evolution',
        philosophy: 'Permanent upgrades that reflect who you are becoming.',
        rules: 'Diamonds only. Non-refundable.',
        icon: Zap,
        isDiamond: true,
        items: [
            // Access Unlocks
            { id: 'e1', name: 'Unlock Milestones', cost: 10, currency: 'gems' as const, category: 'System Evolution' },
            { id: 'e2', name: 'Unlock Recovery Permits', cost: 25, currency: 'gems' as const, category: 'System Evolution' },
            // Protection
            { id: 'e_shield', name: 'Streak Shield', cost: 20, currency: 'gems' as const, category: 'System Evolution' },
            // Progression
            { id: 'e5_gold_boost', name: 'Income Optimization (+20%)', cost: 100, currency: 'gems' as const, category: 'System Evolution' },
            // Identity
            { id: 't1', name: 'Title: Disciplined', cost: 5, currency: 'gems' as const, category: 'System Evolution' },
            { id: 't2', name: 'Title: Builder', cost: 15, currency: 'gems' as const, category: 'System Evolution' },
            { id: 't3', name: 'Title: Consistent', cost: 30, currency: 'gems' as const, category: 'System Evolution' },
            { id: 't4', name: 'Title: Anchor', cost: 50, currency: 'gems' as const, category: 'System Evolution' },
        ],
    },
};

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================
interface SectionProps {
    title: string;
    philosophy: string;
    rules: string;
    icon: any;
    items: ShopItem[];
    isDiamond?: boolean;
    isLocked?: boolean;
    lockReason?: string;
    isShopLocked?: boolean;
    onBuy: (item: ShopItem) => void;
    colors: any;
}

const Section: React.FC<SectionProps> = ({
    title, philosophy, rules, icon: Icon, items, isDiamond, isLocked, lockReason, isShopLocked, onBuy, colors
}) => {
    const [expanded, setExpanded] = useState(false); // All sections start collapsed

    const toggle = () => {
        Haptics.selectionAsync();
        setExpanded(!expanded);
    };

    return (
        <View style={[styles.section, isDiamond && { borderColor: colors.primary, borderWidth: 1 }]}>
            <TouchableOpacity
                style={[styles.sectionHeader, { backgroundColor: isDiamond ? colors.primary + '10' : colors.cardBg }]}
                onPress={toggle}
                activeOpacity={0.8}
            >
                <View style={styles.sectionHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDiamond ? colors.primary + '20' : colors.background }]}>
                        <Icon size={18} color={isDiamond ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={styles.sectionTitleGroup}>
                        <Text style={[styles.sectionTitle, { color: isDiamond ? colors.primary : colors.textPrimary }]}>
                            {title}
                        </Text>
                        <Text style={[styles.sectionPhilosophy, { color: colors.textSecondary }]}>
                            {philosophy}
                        </Text>
                    </View>
                </View>
                {expanded ?
                    <ChevronUp size={20} color={colors.textSecondary} /> :
                    <ChevronDown size={20} color={colors.textSecondary} />
                }
            </TouchableOpacity>

            {expanded && (
                <View style={styles.sectionContent}>
                    {/* Rules / Lock Reason */}
                    <View style={[styles.rulesBar, { backgroundColor: colors.background }]}>
                        {isLocked ? (
                            <View style={styles.lockInfo}>
                                <Lock size={12} color={colors.negative} />
                                <Text style={[styles.rulesText, { color: colors.negative }]}>{lockReason}</Text>
                            </View>
                        ) : isShopLocked && !isDiamond ? (
                            <View style={styles.lockInfo}>
                                <Lock size={12} color={colors.negative} />
                                <Text style={[styles.rulesText, { color: colors.negative }]}>Integrity below 70%. Complete more dailies.</Text>
                            </View>
                        ) : (
                            <Text style={[styles.rulesText, { color: colors.textSecondary }]}>{rules}</Text>
                        )}
                    </View>

                    {/* Items Grid */}
                    <View style={styles.itemsGrid}>
                        {items.map(item => {
                            const canAfford = isDiamond
                                ? item.cost <= (item as any).userGems
                                : item.cost <= (item as any).userGold;
                            const itemLocked = isLocked || (isShopLocked && !isDiamond);

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.itemCard,
                                        { backgroundColor: colors.cardBg, borderColor: colors.border },
                                        isDiamond && { borderColor: colors.primary + '40' },
                                        itemLocked && styles.itemCardLocked
                                    ]}
                                    onPress={() => onBuy(item)}
                                    disabled={itemLocked}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.itemName,
                                        { color: itemLocked ? colors.textSecondary : colors.textPrimary }
                                    ]}>
                                        {item.name}
                                    </Text>
                                    <View style={styles.itemCostRow}>
                                        {isDiamond ? (
                                            <Diamond size={14} color={colors.primary} />
                                        ) : (
                                            <Coins size={14} color={colors.gold} />
                                        )}
                                        <Text style={[
                                            styles.itemCost,
                                            { color: isDiamond ? colors.primary : colors.gold }
                                        ]}>
                                            {item.cost}
                                        </Text>
                                    </View>
                                    {itemLocked && (
                                        <View style={styles.itemLockOverlay}>
                                            <Lock size={16} color={colors.textSecondary} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
};

// ============================================
// MAIN SHOP MODAL
// ============================================
export const ShopModal = ({ visible, onClose }: ShopModalProps) => {
    const { state, dispatch } = useGame();
    const { colors, spacing } = useTheme();
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();
    const user = state.user;

    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCost, setNewCost] = useState('');
    const [newCategory, setNewCategory] = useState<'daily' | 'weekly'>('daily');

    // Integrity calculation
    const dailyTotal = state.dailies.length;
    const dailyCompleted = state.dailies.filter(d => d.completed).length;
    const integrityPercent = dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 100;
    const isShopLocked = integrityPercent < 70;

    // Check unlocks
    const hasRecoveryUnlock = state.purchases.some(p => p.id === 'e2');
    const hasMilestoneUnlock = state.purchases.some(p => p.id === 'e1');
    const hasAnchorTitle = state.purchases.some(p => p.id === 't4');
    const recoveryLocked = !hasRecoveryUnlock || !hasAnchorTitle;

    const handleBuy = (item: ShopItem) => {
        const isDiamond = item.currency === 'gems';
        const balance = isDiamond ? user.gems : user.gold;

        // Integrity check for gold purchases
        if (!isDiamond && isShopLocked) {
            showAlert(
                "Integrity Required",
                "Gold rewards require 70% daily completion.\n\nThis protects you from spending before you've earned it."
            );
            return;
        }

        // Recovery section gate
        if (item.category === 'Permission Rewards') {
            if (recoveryLocked) {
                showAlert(
                    "Recovery Permits Locked",
                    "These rewards are for users who have proven sustained discipline.\n\nRequires:\n• Recovery Unlock (25 💎)\n• Title: Anchor (50 💎)"
                );
                return;
            }
        }

        // Milestone gate
        if (item.category === 'Milestones' && !hasMilestoneUnlock) {
            showAlert(
                "Milestones Locked",
                "Major rewards require a foundation.\n\nUnlock with: Milestone Access (10 💎)"
            );
            return;
        }

        // Balance check
        if (balance < item.cost) {
            showAlert(
                isDiamond ? "Insufficient Diamonds" : "Insufficient Gold",
                `This costs ${item.cost}. You have ${balance}.`
            );
            return;
        }

        // Confirmation
        if (isDiamond) {
            showAlert(
                "Permanent Purchase",
                `${item.name}\n\nCost: ${item.cost} Diamonds\n\nDiamonds represent identity. This cannot be undone.`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Confirm",
                        onPress: () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            dispatch({ type: 'BUY_REWARD', payload: item });
                        }
                    }
                ]
            );
        } else {
            showAlert(
                "Confirm Reward",
                `${item.name}\n\nCost: ${item.cost} Gold`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Claim",
                        onPress: () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            dispatch({ type: 'BUY_REWARD', payload: item });
                        }
                    }
                ]
            );
        }
    };

    const handleAddCustomReward = () => {
        if (!newName.trim() || !newCost.trim()) return;
        const cost = parseInt(newCost);
        if (isNaN(cost) || cost < 10 || cost > 500) {
            showAlert("Invalid Cost", "Custom rewards must cost between 10-500 Gold.");
            return;
        }

        const categoryMap = {
            'daily': 'Daily Comforts',
            'weekly': 'Weekly Joys',
        };

        dispatch({
            type: 'ADD_REWARD',
            payload: {
                id: `custom_${Date.now()}`,
                name: newName.trim(),
                cost,
                currency: 'gold',
                category: categoryMap[newCategory]
            }
        });

        setNewName('');
        setNewCost('');
        setIsAdding(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Merge custom rewards
    const getDailyItems = () => {
        const custom = state.customRewards.filter(r => r.category === 'Daily Comforts');
        return [...custom, ...REWARDS.daily.items];
    };

    const getWeeklyItems = () => {
        const custom = state.customRewards.filter(r => r.category === 'Weekly Joys');
        return [...custom, ...REWARDS.weekly.items];
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Rewards</Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            Earned through discipline
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Balance Bar */}
                <View style={[styles.balanceBar, { backgroundColor: colors.cardBg }]}>
                    <View style={styles.balanceItem}>
                        <Coins size={18} color={colors.gold} />
                        <Text style={[styles.balanceValue, { color: colors.gold }]}>{user.gold}</Text>
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Gold</Text>
                    </View>
                    <View style={[styles.balanceDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.balanceItem}>
                        <Diamond size={16} color={colors.primary} />
                        <Text style={[styles.balanceValue, { color: colors.primary }]}>{user.gems}</Text>
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Diamonds</Text>
                    </View>
                    <View style={[styles.balanceDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.balanceItem}>
                        <Text style={[
                            styles.integrityValue,
                            { color: isShopLocked ? colors.negative : colors.positive }
                        ]}>
                            {integrityPercent}%
                        </Text>
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Integrity</Text>
                    </View>
                </View>

                {/* Custom Reward Form */}
                {isAdding && (
                    <View style={[styles.addForm, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                            CREATE PERSONAL REWARD
                        </Text>
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                            placeholder="Reward name"
                            placeholderTextColor={colors.textSecondary + '80'}
                            value={newName}
                            onChangeText={setNewName}
                            maxLength={30}
                        />
                        <View style={styles.formRow}>
                            <TextInput
                                style={[styles.input, styles.costInput, { color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="10-500"
                                placeholderTextColor={colors.textSecondary + '80'}
                                value={newCost}
                                onChangeText={setNewCost}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                            <TouchableOpacity
                                style={[styles.categoryBtn, { backgroundColor: colors.background }]}
                                onPress={() => setNewCategory(newCategory === 'daily' ? 'weekly' : 'daily')}
                            >
                                <Text style={[styles.categoryText, { color: colors.textPrimary }]}>
                                    {newCategory === 'daily' ? 'Daily' : 'Weekly'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                                onPress={handleAddCustomReward}
                            >
                                <Text style={styles.addBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Sections */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* System Evolution (Diamonds) — Always First */}
                    <Section
                        title={REWARDS.system.title}
                        philosophy={REWARDS.system.philosophy}
                        rules={REWARDS.system.rules}
                        icon={REWARDS.system.icon}
                        items={REWARDS.system.items}
                        isDiamond={true}
                        onBuy={handleBuy}
                        colors={colors}
                    />

                    {/* Daily Comforts */}
                    <Section
                        title={REWARDS.daily.title}
                        philosophy={REWARDS.daily.philosophy}
                        rules={REWARDS.daily.rules}
                        icon={REWARDS.daily.icon}
                        items={getDailyItems()}
                        isShopLocked={isShopLocked}
                        onBuy={handleBuy}
                        colors={colors}
                    />

                    {/* Weekly Rituals */}
                    <Section
                        title={REWARDS.weekly.title}
                        philosophy={REWARDS.weekly.philosophy}
                        rules={REWARDS.weekly.rules}
                        icon={REWARDS.weekly.icon}
                        items={getWeeklyItems()}
                        isShopLocked={isShopLocked}
                        onBuy={handleBuy}
                        colors={colors}
                    />

                    {/* Recovery Permits */}
                    <Section
                        title={REWARDS.recovery.title}
                        philosophy={REWARDS.recovery.philosophy}
                        rules={REWARDS.recovery.rules}
                        icon={REWARDS.recovery.icon}
                        items={REWARDS.recovery.items}
                        isLocked={recoveryLocked}
                        lockReason="Requires Recovery Unlock + Title: Anchor"
                        isShopLocked={isShopLocked}
                        onBuy={handleBuy}
                        colors={colors}
                    />

                    {/* Milestones */}
                    <Section
                        title={REWARDS.milestone.title}
                        philosophy={REWARDS.milestone.philosophy}
                        rules={REWARDS.milestone.rules}
                        icon={REWARDS.milestone.icon}
                        items={REWARDS.milestone.items}
                        isLocked={!hasMilestoneUnlock}
                        lockReason="Requires Milestone Unlock (10 💎)"
                        isShopLocked={isShopLocked}
                        onBuy={handleBuy}
                        colors={colors}
                    />

                    {/* Add Custom Reward Button */}
                    <TouchableOpacity
                        style={[styles.addCustomBtn, { borderColor: colors.border }]}
                        onPress={() => setIsAdding(!isAdding)}
                    >
                        <Plus size={18} color={colors.textSecondary} />
                        <Text style={[styles.addCustomText, { color: colors.textSecondary }]}>
                            Add Personal Reward
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: Math.max(insets.bottom + 60, 100) }} />
                </ScrollView>
            </View>
        </Modal>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
    },
    balanceBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: RADIUS.lg,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    balanceItem: {
        alignItems: 'center',
        gap: 4,
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    balanceLabel: {
        fontSize: 11,
        fontFamily: 'Inter_400Regular',
    },
    integrityValue: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    balanceDivider: {
        width: 1,
        height: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    section: {
        marginBottom: 16,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitleGroup: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    sectionPhilosophy: {
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        marginTop: 2,
    },
    sectionContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    rulesBar: {
        padding: 10,
        borderRadius: RADIUS.sm,
        marginBottom: 12,
    },
    lockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rulesText: {
        fontSize: 12,
        fontFamily: 'Inter_500Medium',
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    itemCard: {
        width: '48%',
        padding: 14,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        minHeight: 80,
        justifyContent: 'space-between',
    },
    itemCardLocked: {
        opacity: 0.5,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Inter_500Medium',
        marginBottom: 8,
        paddingRight: 24, // Prevent overlap with lock icon
    },
    itemCostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    itemCost: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    itemLockOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    addCustomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 8,
    },
    addCustomText: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
    },
    addForm: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
    },
    formLabel: {
        fontSize: 11,
        fontFamily: 'Inter_600SemiBold',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: RADIUS.sm,
        padding: 12,
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        marginBottom: 10,
    },
    formRow: {
        flexDirection: 'row',
        gap: 10,
    },
    costInput: {
        flex: 1,
        marginBottom: 0,
    },
    categoryBtn: {
        paddingHorizontal: 16,
        borderRadius: RADIUS.sm,
        justifyContent: 'center',
    },
    categoryText: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
    },
    addBtn: {
        paddingHorizontal: 20,
        borderRadius: RADIUS.sm,
        justifyContent: 'center',
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
});
