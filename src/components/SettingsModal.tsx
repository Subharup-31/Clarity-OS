import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, ScrollView, Image, TextInput, Platform, Alert } from 'react-native';
import { useGame } from '../context/GameContext';
import { useTheme } from '../hooks/useTheme';
import { PALETTES } from '../constants/theme';
import { X, Check, Calendar as CalendarIcon, ShoppingBag, BarChart3, Bell } from 'lucide-react-native';
import { StreakCalendarModal } from './StreakCalendarModal';
import { ShopModal } from './ShopModal';
import { WeeklyReviewModal } from './WeeklyReviewModal';
import { getIsDark } from '../utils/colors';
import { useAlert } from '../context/AlertContext';
import { RADIUS, TEXT_STYLES } from '../constants/tokens';
import { Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleNotifications, cancelAllNotifications, requestNotificationPermissions } from '../services/notifications';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    const { state, dispatch } = useGame();
    const { colors, sizes, spacing, themeName } = useTheme();
    const { showAlert } = useAlert();
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [isShopVisible, setShopVisible] = useState(false);
    const [isWeeklyReviewVisible, setWeeklyReviewVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Time picker state
    const [showMorningPicker, setShowMorningPicker] = useState(false);
    const [showEveningPicker, setShowEveningPicker] = useState(false);

    // Track initial mount to prevent scheduling on first render
    const isInitialMount = useRef(true);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Schedule notifications when TIME changes (not on initial mount)
    // Note: handleEnableNotifications handles the enabled toggle, so we only react to time changes here
    useEffect(() => {
        // Skip initial mount - notifications are already scheduled from previous sessions
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Only reschedule if notifications are enabled (time changed while enabled)
        if (!state.user.notificationSettings.enabled) {
            return;
        }

        // Debounce to prevent multiple rapid calls when settings change quickly
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            await scheduleNotifications({
                enabled: true,
                morningTime: state.user.notificationSettings.morningTime,
                eveningTime: state.user.notificationSettings.eveningTime,
                themeColor: colors.primary,
            });
        }, 500);

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [
        // Only watch time changes - enabled toggle is handled by handleEnableNotifications
        state.user.notificationSettings.morningTime,
        state.user.notificationSettings.eveningTime,
    ]);

    const handleEnableNotifications = async (value: boolean) => {
        if (value) {
            const granted = await requestNotificationPermissions(colors.primary);
            if (!granted) {
                Alert.alert(
                    'Permissions Required',
                    'Please enable notifications in your device settings to receive reminders.',
                    [{ text: 'OK' }]
                );
                return;
            }
            // Schedule notifications immediately when enabling
            await scheduleNotifications({
                enabled: true,
                morningTime: state.user.notificationSettings.morningTime,
                eveningTime: state.user.notificationSettings.eveningTime,
                themeColor: colors.primary,
            });
        } else {
            // Cancel all notifications when disabling
            await cancelAllNotifications();
        }
        dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: { enabled: value } });
    };

    const parseTimeToDate = (time: string): Date => {
        const [hours, minutes] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const formatTimeFromDate = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };


    // Generate full list from 100+ themes
    const themes = Object.keys(PALETTES).map(key => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        color: PALETTES[key as keyof typeof PALETTES].background
    })).sort((a, b) => a.name.localeCompare(b.name));

    // Filter themes based on search
    const filteredThemes = useMemo(() => {
        if (!searchQuery.trim()) return themes;
        return themes.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [themes, searchQuery]);

    // Theme categories
    const lightThemeIds = [
        'light', 'paper', 'cloud', 'paladin', 'arctic', 'snow', 'minimal', 'cream',
        'sage', 'lavender', 'mint', 'rose', 'sky',
        // New light themes
        'peach', 'lemon', 'coral', 'aqua', 'lilac', 'honey', 'blush', 'breeze',
        // Animated light themes
        'sunbeam', 'daydream', 'cotton_candy', 'spring_rain', 'sparkle', 'morning_mist'
    ];

    const darkThemeIds = [
        'dark', 'midnight', 'oled', 'slate', 'obsidian', 'dracula', 'nord', 'gruvbox',
        'material_dark', 'graphite', 'forest', 'ocean', 'sunset',
        'starry_night', 'rain', 'snow_night', 'fireflies', 'embers', 'bubbles',
        'blossom', 'cosmos', 'gold_dust', 'leaf_fall', 'shimmer',
        'aurora', 'sakura', 'nebula', 'underwater', 'volcanic', 'zen', 'midnight_oil', 'candlelight'
    ];

    const characterThemeIds = [
        'iron_man', 'thanos', 'batman', 'joker', 'spider_2099', 'deadpool', 'witcher', 'dune',
        'gojo', 'sukuna', 'nezuko', 'tanjiro', 'eva_unit', 'goku', 'naruto', 'saitama',
        'kratos', 'link'
    ];

    const handleThemeSelect = (id: string) => {
        Haptics.selectionAsync();
        dispatch({ type: 'SET_THEME', payload: id });
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Haptics Toggle */}
                        <View style={[styles.row, { borderBottomColor: colors.border }]}>
                            <View>
                                <Text style={[styles.label, { color: colors.textPrimary }]}>Haptics</Text>
                                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Vibrate on actions</Text>
                            </View>
                            <Switch
                                value={state.user.hapticsEnabled}
                                onValueChange={() => dispatch({ type: 'TOGGLE_HAPTICS' })}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#fff"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.historyBtn, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 24 }]}
                            onPress={() => setCalendarVisible(true)}
                        >
                            <CalendarIcon color={colors.primary} size={20} />
                            <Text style={[styles.historyBtnText, { color: colors.textPrimary }]}>View Streak History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.historyBtn, { backgroundColor: colors.cardBg, borderColor: colors.gold, marginTop: 12 }]}
                            onPress={() => setShopVisible(true)}
                        >
                            <ShoppingBag color={colors.gold} size={20} />
                            <Text style={[styles.historyBtnText, { color: colors.gold }]}>Enter Rewards Shop</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.historyBtn, { backgroundColor: colors.cardBg, borderColor: colors.primary, marginTop: 12 }]}
                            onPress={() => setWeeklyReviewVisible(true)}
                        >
                            <BarChart3 color={colors.primary} size={20} />
                            <Text style={[styles.historyBtnText, { color: colors.primary }]}>Weekly Review</Text>
                        </TouchableOpacity>

                        {/* Reminders Section */}
                        <View style={[styles.section, { marginTop: 24 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Bell color={colors.textSecondary} size={16} style={{ marginTop: -13 }} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Reminders</Text>
                            </View>
                            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginLeft: 26 }]}>
                                Gentle check-ins. Never pressure.
                            </Text>

                            {/* Enable Toggle */}
                            <View style={[styles.row, { borderBottomColor: colors.border, marginTop: 12 }]}>
                                <View>
                                    <Text style={[styles.label, { color: colors.textPrimary }]}>Enable Reminders</Text>
                                </View>
                                <Switch
                                    value={state.user.notificationSettings.enabled}
                                    onValueChange={handleEnableNotifications}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor="#fff"
                                />
                            </View>

                            {state.user.notificationSettings.enabled && (
                                <>
                                    {/* Morning Time */}
                                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.label, { color: colors.textPrimary }]}>Morning</Text>
                                        <TouchableOpacity
                                            style={[styles.timeBtn, { backgroundColor: colors.background }]}
                                            onPress={() => setShowMorningPicker(true)}
                                        >
                                            <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                                                {state.user.notificationSettings.morningTime}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Evening Time */}
                                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.label, { color: colors.textPrimary }]}>Evening</Text>
                                        <TouchableOpacity
                                            style={[styles.timeBtn, { backgroundColor: colors.background }]}
                                            onPress={() => setShowEveningPicker(true)}
                                        >
                                            <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                                                {state.user.notificationSettings.eveningTime}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Morning Time Picker */}
                                    {showMorningPicker && (
                                        <DateTimePicker
                                            value={parseTimeToDate(state.user.notificationSettings.morningTime)}
                                            mode="time"
                                            is24Hour={true}
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                setShowMorningPicker(Platform.OS === 'ios');
                                                if (selectedDate) {
                                                    dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: { morningTime: formatTimeFromDate(selectedDate) } });
                                                }
                                            }}
                                        />
                                    )}

                                    {/* Evening Time Picker */}
                                    {showEveningPicker && (
                                        <DateTimePicker
                                            value={parseTimeToDate(state.user.notificationSettings.eveningTime)}
                                            mode="time"
                                            is24Hour={true}
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                setShowEveningPicker(Platform.OS === 'ios');
                                                if (selectedDate) {
                                                    dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: { eveningTime: formatTimeFromDate(selectedDate) } });
                                                }
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </View>

                        {/* Avatar Selector */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Avatar</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                {[
                                    // Original avatars
                                    'ClarityOS', 'Hero', 'Wizard', 'Rogue', 'Paladin', 'Ninja', 'Robot', 'Alien',
                                    'Cat', 'Dog', 'Samurai', 'Viking', 'Pirate', 'Ghost', 'Skeleton', 'Punk',
                                    'Mage', 'Knight', 'King', 'Queen',
                                    // New avatars
                                    'Dragon', 'Phoenix', 'Warrior', 'Archer', 'Elf', 'Dwarf', 'Demon', 'Angel',
                                    'Tiger', 'Wolf', 'Bear', 'Eagle', 'Panda', 'Fox', 'Owl', 'Cyborg', 'Astronaut',
                                    'Spartan', 'Shogun', 'Ronin', 'Crusader', 'Assassin', 'Ranger', 'Bard', 'Necromancer'
                                ].map((seed) => (
                                    <TouchableOpacity
                                        key={seed}
                                        style={[
                                            styles.avatarOption,
                                            { borderColor: state.user.avatarId === seed ? colors.primary : 'transparent' }
                                        ]}
                                        onPress={() => dispatch({ type: 'SET_AVATAR', payload: seed })}
                                    >
                                        <Image
                                            source={{ uri: `https://api.dicebear.com/7.x/pixel-art/png?seed=${seed}` }}
                                            style={styles.avatarImg}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity
                            style={[styles.option, { marginTop: 20, marginBottom: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 }]}
                            onPress={() => {
                                showAlert(
                                    "Reset Habits?",
                                    "This will reset all your +/- counters to zero.\nThis cannot be undone.",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Reset",
                                            style: "destructive",
                                            onPress: () => {
                                                dispatch({ type: 'RESET_HABIT_COUNTS' });
                                                // Success feedback
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Text style={[styles.optionText, { color: colors.negative }]}>Reset Habit Counts</Text>
                            <Text style={{ fontSize: 12, color: colors.negative }}>Reset " +10 | -4 " stats</Text>
                        </TouchableOpacity>




                        {/* Theme Search */}
                        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Search color={colors.textSecondary} size={18} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.textPrimary }]}
                                placeholder="Search themes..."
                                placeholderTextColor={colors.textSecondary + '80'}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X color={colors.textSecondary} size={18} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Theme Selector */}
                        {/* Light Themes */}
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Light Themes</Text>
                        <View style={styles.themeGrid}>
                            {filteredThemes.filter(t => lightThemeIds.includes(t.id)).map((t) => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[
                                        styles.themeOption,
                                        { backgroundColor: t.color, borderColor: themeName === t.id ? colors.primary : colors.border },
                                        themeName === t.id && styles.themeOptionSelected
                                    ]}
                                    onPress={() => handleThemeSelect(t.id)}
                                    activeOpacity={0.8}
                                >
                                    {themeName === t.id && <Check color={getIsDark(t.color) ? '#fff' : '#000'} size={18} strokeWidth={3} />}
                                    <Text style={[styles.themeName, { color: getIsDark(t.color) ? '#fff' : '#000' }]}>{t.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Dark Themes */}
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Dark Themes</Text>
                        <View style={styles.themeGrid}>
                            {filteredThemes.filter(t => darkThemeIds.includes(t.id)).map((t) => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[
                                        styles.themeOption,
                                        { backgroundColor: t.color, borderColor: themeName === t.id ? colors.primary : colors.border },
                                        themeName === t.id && styles.themeOptionSelected
                                    ]}
                                    onPress={() => handleThemeSelect(t.id)}
                                    activeOpacity={0.8}
                                >
                                    {themeName === t.id && <Check color={getIsDark(t.color) ? '#fff' : '#000'} size={18} strokeWidth={3} />}
                                    <Text style={[styles.themeName, { color: getIsDark(t.color) ? '#fff' : '#000' }]}>{t.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Character-Inspired Themes */}
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Character-Inspired</Text>
                        <View style={styles.themeGrid}>
                            {filteredThemes.filter(t => characterThemeIds.includes(t.id)).map((t) => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[
                                        styles.themeOption,
                                        { backgroundColor: t.color, borderColor: themeName === t.id ? colors.primary : colors.border },
                                        themeName === t.id && styles.themeOptionSelected
                                    ]}
                                    onPress={() => handleThemeSelect(t.id)}
                                    activeOpacity={0.8}
                                >
                                    {themeName === t.id && <Check color={getIsDark(t.color) ? '#fff' : '#000'} size={18} strokeWidth={3} />}
                                    <Text style={[styles.themeName, { color: getIsDark(t.color) ? '#fff' : '#000' }]}>{t.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
            <StreakCalendarModal visible={isCalendarVisible} onClose={() => setCalendarVisible(false)} />
            <ShopModal visible={isShopVisible} onClose={() => setShopVisible(false)} />
            <WeeklyReviewModal visible={isWeeklyReviewVisible} onClose={() => setWeeklyReviewVisible(false)} />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 0,
        height: '70%', // Adjusted to 70% per user request
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Inter_700Bold',
    },
    content: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
    },
    subLabel: {
        fontSize: 14,
        marginTop: 4,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    themeOption: {
        width: '30%', // 3 Columns for density
        height: 70,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeOptionSelected: {
        borderWidth: 3,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        padding: 0,
    },
    themeName: {
        marginTop: 8,
        fontWeight: 'bold',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    optionText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    toggle: {
        width: 50,
        height: 30,
        borderRadius: 15,
        padding: 2,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
    },
    avatarOption: {
        borderWidth: 2,
        borderRadius: 25,
        padding: 2,
    },
    avatarImg: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    historyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        gap: 12,
    },
    historyBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    button: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    separator: {
        height: 1,
        width: '100%',
        marginVertical: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
        marginBottom: 8,
    },
    timeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    timeText: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        fontWeight: '600',
    },
});
