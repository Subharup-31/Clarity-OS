import React, { useState, useRef } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HabitsScreen } from '../screens/HabitsScreen';
import { DailiesScreen } from '../screens/DailiesScreen';
import { TodosScreen } from '../screens/TodosScreen';
import { PlusSquare, Calendar, CheckSquare, Settings as SettingsIcon } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { DiamondButton } from '../components/DiamondButton';
import { AddTaskModal } from '../components/AddTaskModal';
import { SettingsModal } from '../components/SettingsModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { TopBar } from '../components/TopBar';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { useGame } from '../context/GameContext';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';

export const MainNavigator = () => {
    const { colors, spacing } = useTheme();
    const { state, dispatch, isLoaded } = useGame();
    const insets = useSafeAreaInsets();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const pagerRef = useRef<PagerView>(null);

    const handlePageSelected = (e: any) => {
        setActiveIndex(e.nativeEvent.position);
    };

    const handleTabPress = (index: number) => {
        pagerRef.current?.setPage(index);
        setActiveIndex(index);
    };

    const MyTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: colors.background,
        },
    };

    return (
        <NavigationContainer theme={MyTheme}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                {/* Fixed Header - stays in place during swipe */}
                <TopBar />

                {/* Fixed Calendar - stays in place during swipe */}
                <View style={{ paddingHorizontal: spacing.s, paddingBottom: spacing.s, paddingTop: spacing.m }}>
                    <WeeklyCalendar />
                </View>

                {/* Swipeable content area - only task lists move */}
                <PagerView
                    ref={pagerRef}
                    style={{ flex: 1 }}
                    initialPage={0}
                    onPageSelected={handlePageSelected}
                    overdrag={false}
                    offscreenPageLimit={1}
                    pageMargin={0}
                >
                    <View key="habits" style={{ flex: 1 }}>
                        <HabitsScreen />
                    </View>
                    <View key="dailies" style={{ flex: 1 }}>
                        <DailiesScreen />
                    </View>
                    <View key="todos" style={{ flex: 1 }}>
                        <TodosScreen />
                    </View>
                </PagerView>

                {/* Fixed Tab Bar - stays in place during swipe */}
                <View style={[
                    styles.tabBar,
                    {
                        backgroundColor: (colors as any).navBg || colors.cardBg,
                        paddingBottom: insets.bottom + 8,
                    }
                ]}>
                    {/* Habits Tab */}
                    <TouchableOpacity
                        style={styles.tabItem}
                        onPress={() => handleTabPress(0)}
                    >
                        <PlusSquare
                            color={activeIndex === 0 ? colors.primary : colors.textSecondary}
                            size={24}
                        />
                        <Text style={[
                            styles.tabLabel,
                            { color: activeIndex === 0 ? colors.primary : colors.textSecondary }
                        ]}>Habits</Text>
                    </TouchableOpacity>

                    {/* Dailies Tab */}
                    <TouchableOpacity
                        style={styles.tabItem}
                        onPress={() => handleTabPress(1)}
                    >
                        <Calendar
                            color={activeIndex === 1 ? colors.primary : colors.textSecondary}
                            size={24}
                        />
                        <Text style={[
                            styles.tabLabel,
                            { color: activeIndex === 1 ? colors.primary : colors.textSecondary }
                        ]}>Dailies</Text>
                    </TouchableOpacity>

                    {/* Add Button (Center) */}
                    <DiamondButton onPress={() => setModalVisible(true)} />

                    {/* To Do's Tab */}
                    <TouchableOpacity
                        style={styles.tabItem}
                        onPress={() => handleTabPress(2)}
                    >
                        <CheckSquare
                            color={activeIndex === 2 ? colors.primary : colors.textSecondary}
                            size={24}
                        />
                        <Text style={[
                            styles.tabLabel,
                            { color: activeIndex === 2 ? colors.primary : colors.textSecondary }
                        ]}>To Do's</Text>
                    </TouchableOpacity>

                    {/* Settings Tab */}
                    <TouchableOpacity
                        style={styles.tabItem}
                        onPress={() => setSettingsVisible(true)}
                    >
                        <SettingsIcon
                            color={colors.textSecondary}
                            size={24}
                        />
                        <Text style={[
                            styles.tabLabel,
                            { color: colors.textSecondary }
                        ]}>Settings</Text>
                    </TouchableOpacity>
                </View>

                <AddTaskModal
                    visible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    onAdd={(type, title, notes, behaviorType, dueDate) => {
                        const newTask = {
                            id: Date.now().toString(),
                            type,
                            title,
                            notes,
                            createdAt: Date.now(),
                            completed: false,
                            countPositive: 0,
                            countNegative: 0,
                            strength: 0,
                            streak: 0,
                            dueDate: type === 'todo' ? (dueDate || Date.now()) : undefined,
                            behaviorType: behaviorType || 'positive',
                            difficulty: 'easy' as const,
                        };
                        dispatch({
                            type: 'ADD_TASK',
                            payload: newTask as any
                        });
                    }}
                />
                <SettingsModal visible={isSettingsVisible} onClose={() => setSettingsVisible(false)} />
                <OnboardingModal visible={isLoaded && !state.user.hasSeenOnboarding} />
            </View>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 10,
        height: 84,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginTop: 2,
    },
    tabLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 10,
        marginTop: 4,
    },
});
