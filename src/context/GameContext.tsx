import React, { createContext, useReducer, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GameAction, UserStats, Habit, Daily, Todo, ShopItem, DailyStat } from '../types';
import { format, differenceInDays, parseISO, isSameDay, startOfDay } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { AppState } from 'react-native';

// ============================================
// CONSTANTS
// ============================================
const MAX_HP = 50;
const DAILY_GOLD_CAP = 150;
const DAILY_XP_CAP = 500;
const POSITIVE_HABIT_DAILY_LIMIT = 5;
const NEGATIVE_HABIT_DAILY_LIMIT = 2; // Negative = max 2 "Resisted" scores per day

const INITIAL_STATE: GameState = {
    user: {
        hp: MAX_HP,
        maxHp: MAX_HP,
        xp: 0,
        maxXp: 50,
        level: 1,
        gold: 0,
        gems: 0,
        theme: 'dark',
        hapticsEnabled: true,
        avatarId: 'ClarityOS',
        name: 'Player One',
        streakShields: 0,
        goldMultiplier: 1,
        todayGoldEarned: 0,
        todayXpEarned: 0,
        lastEarnDate: format(new Date(), 'yyyy-MM-dd'),
        // New features
        autoShieldEnabled: false,
        notificationSettings: {
            enabled: false,
            morningTime: '09:00',
            eveningTime: '20:00',
        },
        hasSeenOnboarding: false,
    },
    habits: [],
    dailies: [],
    todos: [],
    lastLoginDate: format(new Date(), 'yyyy-MM-dd'),
    history: {},
    purchases: [],
    customRewards: [],
    dailyStats: {},
};

const STORAGE_KEY = '@clarity_os_v1';

// ============================================
// HELPER FUNCTIONS
// ============================================
const getDifficultyMultiplier = (difficulty: string = 'easy') => {
    switch (difficulty) {
        case 'hard': return 2;
        case 'medium': return 1.5;
        default: return 1;
    }
};

const calculateXpGain = (difficulty: string = 'easy') => 10 * getDifficultyMultiplier(difficulty);
const calculateGoldGain = (base: number, difficulty: string = 'easy') => Math.ceil(base * getDifficultyMultiplier(difficulty));
const calculateDamage = (difficulty: string = 'easy') => 5 * getDifficultyMultiplier(difficulty);
const calculateHpRecovery = (difficulty: string = 'easy') => Math.ceil(2 * getDifficultyMultiplier(difficulty));

const triggerHaptics = (type: 'success' | 'error' | 'impact', enabled: boolean) => {
    if (!enabled) return;
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (type === 'impact') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

const getTodayString = () => format(new Date(), 'yyyy-MM-dd');

const addXpWithCap = (user: UserStats, amount: number, todayStr: string): number => {
    if (user.lastEarnDate !== todayStr) {
        user.todayXpEarned = 0;
        user.todayGoldEarned = 0;
        user.lastEarnDate = todayStr;
    }
    const remaining = DAILY_XP_CAP - (user.todayXpEarned || 0);
    const actual = Math.min(amount, remaining);
    user.todayXpEarned = (user.todayXpEarned || 0) + actual;
    return actual;
};

const addGoldWithCap = (user: UserStats, amount: number, todayStr: string): number => {
    if (user.lastEarnDate !== todayStr) {
        user.todayXpEarned = 0;
        user.todayGoldEarned = 0;
        user.lastEarnDate = todayStr;
    }
    const remaining = DAILY_GOLD_CAP - (user.todayGoldEarned || 0);
    const actual = Math.min(amount, remaining);
    user.todayGoldEarned = (user.todayGoldEarned || 0) + actual;
    return actual;
};

// ============================================
// GAME REDUCER
// ============================================
const gameReducer = (state: GameState, action: GameAction): GameState => {
    let newState = { ...state };
    let user = { ...state.user };
    const todayStr = getTodayString();

    switch (action.type) {
        case 'ADD_TASK':
            if (action.payload.type === 'habit') newState.habits = [...state.habits, action.payload as Habit];
            if (action.payload.type === 'daily') newState.dailies = [...state.dailies, action.payload as Daily];
            if (action.payload.type === 'todo') newState.todos = [...state.todos, action.payload as Todo];
            break;

        case 'DELETE_TASK': {
            // For habits and dailies, route to soft-delete to preserve history
            // Only todos are hard-deleted since they don't repeat
            const { id: delId, type: delType } = action.payload;
            if (delType === 'habit') {
                const deletedAtTime = Date.now();
                newState.habits = state.habits.map(h =>
                    h.id === delId ? { ...h, deletedAt: deletedAtTime } : h
                );
            } else if (delType === 'daily') {
                const deletedAtTime = Date.now();
                newState.dailies = state.dailies.map(d =>
                    d.id === delId ? { ...d, deletedAt: deletedAtTime } : d
                );
            } else if (delType === 'todo') {
                newState.todos = state.todos.filter(t => t.id !== delId);
            }
            break;
        }

        case 'SOFT_DELETE_TASK': {
            const { id: deleteId, type: deleteType } = action.payload;
            const deletedAt = Date.now();
            if (deleteType === 'habit') {
                newState.habits = state.habits.map(h =>
                    h.id === deleteId ? { ...h, deletedAt } : h
                );
            }
            if (deleteType === 'daily') {
                newState.dailies = state.dailies.map(d =>
                    d.id === deleteId ? { ...d, deletedAt } : d
                );
            }
            // Todos use hard delete - they don't repeat daily
            if (deleteType === 'todo') {
                newState.todos = state.todos.filter(t => t.id !== deleteId);
            }
            break;
        }

        case 'UPDATE_TASK':
            const { id: uId, data } = action.payload;
            newState.habits = state.habits.map(h => h.id === uId ? { ...h, ...data } as Habit : h);
            newState.dailies = state.dailies.map(d => d.id === uId ? { ...d, ...data } as Daily : d);
            newState.todos = state.todos.map(t => t.id === uId ? { ...t, ...data } as Todo : t);
            break;

        case 'SCORE_HABIT': {
            const { id: habitId, direction } = action.payload;
            const habit = state.habits.find(h => h.id === habitId);
            if (!habit) break;

            // Determine daily limit based on behavior type
            const dailyLimit = habit.behaviorType === 'negative'
                ? NEGATIVE_HABIT_DAILY_LIMIT
                : POSITIVE_HABIT_DAILY_LIMIT;

            const isNewDay = habit.lastScoredDate !== todayStr;
            const currentCount = direction === 'positive'
                ? (habit.todayPositiveCount || 0)
                : (habit.todayNegativeCount || 0);

            const atLimit = !isNewDay && currentCount >= dailyLimit;

            newState.habits = state.habits.map(h => {
                if (h.id !== habitId) return h;
                return {
                    ...h,
                    countPositive: direction === 'positive' ? h.countPositive + 1 : h.countPositive,
                    countNegative: direction === 'negative' ? h.countNegative + 1 : h.countNegative,
                    lastScoredDate: todayStr,
                    todayPositiveCount: direction === 'positive'
                        ? (isNewDay ? 1 : (h.todayPositiveCount || 0) + 1)
                        : (isNewDay ? 0 : h.todayPositiveCount || 0),
                    todayNegativeCount: direction === 'negative'
                        ? (isNewDay ? 1 : (h.todayNegativeCount || 0) + 1)
                        : (isNewDay ? 0 : h.todayNegativeCount || 0),
                };
            });

            if (!atLimit) {
                // Determine if this action should reward or punish
                // For POSITIVE habits: + = reward, - = punish
                // For NEGATIVE habits: - = reward (resisted!), + = punish (gave in!)
                const isRewardAction = habit.behaviorType === 'negative'
                    ? direction === 'negative'  // For negative habits, "-" means resisted = reward
                    : direction === 'positive'; // For positive habits, "+" means did it = reward

                if (isRewardAction) {
                    const totalDailies = state.dailies.length;
                    const completedDailies = state.dailies.filter(d => d.completed).length;
                    const integrity = totalDailies > 0 ? completedDailies / totalDailies : 0;
                    const rawMultiplier = user.goldMultiplier || 1;
                    const effectiveMultiplier = integrity >= 0.7 ? rawMultiplier : 1.0;

                    const xpGain = addXpWithCap(user, calculateXpGain(habit.difficulty), todayStr);
                    const goldGain = addGoldWithCap(user, Math.floor(1 * effectiveMultiplier), todayStr);

                    user.xp += xpGain;
                    user.gold += goldGain;
                    user.hp = Math.min(user.maxHp, user.hp + 1);
                    triggerHaptics('success', user.hapticsEnabled);
                } else {
                    user.hp -= calculateDamage(habit.difficulty);
                    triggerHaptics('error', user.hapticsEnabled);
                }
            } else {
                triggerHaptics('impact', user.hapticsEnabled);
            }
            break;
        }

        case 'TOGGLE_DAILY': {
            const dailyId = action.payload;
            const daily = state.dailies.find(d => d.id === dailyId);
            if (!daily) break;

            newState.dailies = state.dailies.map(d => {
                if (d.id !== dailyId) return d;
                const isCompleting = !d.completed;

                if (isCompleting) {
                    const alreadyCompletedToday = d.completedAt &&
                        isSameDay(new Date(d.completedAt), new Date());

                    if (!alreadyCompletedToday) {
                        const totalDailies = state.dailies.length;
                        const completedDailies = state.dailies.filter(t => t.completed).length + 1;
                        const integrity = totalDailies > 0 ? completedDailies / totalDailies : 1;
                        const rawMultiplier = user.goldMultiplier || 1;
                        const effectiveMultiplier = integrity >= 0.7 ? rawMultiplier : 1.0;

                        const xpGain = addXpWithCap(user, calculateXpGain(daily.difficulty), todayStr);
                        const goldGain = addGoldWithCap(user, calculateGoldGain(2, daily.difficulty) * effectiveMultiplier, todayStr);

                        user.xp += xpGain;
                        user.gold += goldGain;
                        user.hp = Math.min(user.maxHp, user.hp + calculateHpRecovery(daily.difficulty));
                        triggerHaptics('impact', user.hapticsEnabled);
                    }

                    return {
                        ...d,
                        completed: true,
                        completedAt: d.completedAt && isSameDay(new Date(d.completedAt), new Date())
                            ? d.completedAt
                            : Date.now()
                    };
                } else {
                    return { ...d, completed: false };
                }
            });
            break;
        }

        case 'COMPLETE_TODO': {
            const todoId = action.payload;
            const todo = state.todos.find(t => t.id === todoId);
            if (!todo || todo.completed) break;

            newState.todos = state.todos.map(t => {
                if (t.id !== todoId) return t;

                const totalDailies = state.dailies.length;
                const completedDailies = state.dailies.filter(d => d.completed).length;
                const integrity = totalDailies > 0 ? completedDailies / totalDailies : 1;
                const rawMultiplier = user.goldMultiplier || 1;
                const effectiveMultiplier = integrity >= 0.7 ? rawMultiplier : 1.0;

                const xpGain = addXpWithCap(user, calculateXpGain(todo.difficulty), todayStr);
                const goldGain = addGoldWithCap(user, calculateGoldGain(5, todo.difficulty) * effectiveMultiplier, todayStr);

                user.xp += xpGain;
                user.gold += goldGain;
                user.hp = Math.min(user.maxHp, user.hp + calculateHpRecovery(todo.difficulty));
                triggerHaptics('success', user.hapticsEnabled);

                return { ...t, completed: true };
            });
            break;
        }

        case 'RESCHEDULE_TODO': {
            const { id: rId, newDate } = action.payload;
            const todo = state.todos.find(t => t.id === rId);

            if (!todo) break;
            if (todo.completed) break;
            if (newDate && newDate < startOfDay(new Date()).getTime()) break;

            newState.todos = state.todos.map(t => {
                if (t.id !== rId) return t;
                return {
                    ...t,
                    dueDate: newDate,
                    rescheduleCount: (t.rescheduleCount || 0) + 1,
                    originalDueDate: t.originalDueDate || t.dueDate || Date.now()
                };
            });
            break;
        }

        case 'DAILY_RESET': {
            const { date } = action.payload;
            if (date === state.lastLoginDate) return state;

            const lastDate = parseISO(state.lastLoginDate);
            const currentDate = parseISO(date);
            const daysMissed = Math.max(0, differenceInDays(currentDate, lastDate) - 1);

            // ─────────────────────────────────────────
            // FINALIZE DAILY STATS FOR YESTERDAY
            // ─────────────────────────────────────────
            const positiveHabits = state.habits.filter(h => h.behaviorType === 'positive');
            const negativeHabits = state.habits.filter(h => h.behaviorType === 'negative');
            // Dailies are now all binary truths (no behaviorType), treated as positive goals
            const allDailies = state.dailies;

            const completedPositive = allDailies.filter(d => d.completed).length +
                positiveHabits.filter(h => (h.todayPositiveCount || 0) > 0).length;
            const totalPositive = allDailies.length + positiveHabits.length;

            // For negative behaviors: "clean" means they didn't break
            // Only habits have negative behavior type now
            const cleanNegative = negativeHabits.filter(h => (h.todayNegativeCount || 0) === 0).length;
            const totalNegative = negativeHabits.length;

            const yesterdayStat: DailyStat = {
                date: state.lastLoginDate,
                completedPositive,
                totalPositive,
                cleanNegative,
                totalNegative,
                goldEarned: user.todayGoldEarned || 0,
                xpEarned: user.todayXpEarned || 0,
            };

            newState.dailyStats = {
                ...state.dailyStats,
                [state.lastLoginDate]: yesterdayStat
            };

            // ─────────────────────────────────────────
            // AUTO-SHIELD LOGIC
            // ─────────────────────────────────────────
            const allDailiesCompleted = state.dailies.every(d => d.completed);
            const hasFailures = !allDailiesCompleted && state.dailies.length > 0;
            let shieldUsed = false;

            if (hasFailures && daysMissed === 0) {
                // Auto-shield: automatically use a shield to prevent damage
                if (user.autoShieldEnabled && (user.streakShields || 0) > 0) {
                    user.streakShields = (user.streakShields || 0) - 1;
                    user.lastAutoShieldDate = state.lastLoginDate;
                    shieldUsed = true;
                }
                // If auto-shield is disabled, shields are saved for future use
                // User can enable auto-shield in settings when they want protection
            }

            const historyStatus = (allDailiesCompleted || shieldUsed) ? 'success' : 'fail';
            if (state.dailies.length > 0) {
                newState.history = {
                    ...state.history,
                    [state.lastLoginDate]: { status: historyStatus }
                };
            }

            // Calculate damage
            let damageTaken = 0;
            newState.dailies = state.dailies.map(d => {
                if (!d.completed) {
                    damageTaken += calculateDamage(d.difficulty);
                    return {
                        ...d,
                        completed: false,
                        streak: shieldUsed ? d.streak : 0,
                        completedAt: undefined
                    };
                }
                return {
                    ...d,
                    completed: false,
                    streak: d.streak + 1,
                    completedAt: undefined
                };
            });

            if (!shieldUsed) user.hp -= damageTaken;

            if (daysMissed > 0) {
                const missedDayDamage = daysMissed * 10;
                user.hp -= missedDayDamage;
            }

            // Reset habit daily counters
            newState.habits = state.habits.map(h => ({
                ...h,
                todayPositiveCount: 0,
                todayNegativeCount: 0,
                lastScoredDate: undefined
            }));

            // Reset user daily tracking
            user.todayGoldEarned = 0;
            user.todayXpEarned = 0;
            user.lastEarnDate = date;

            newState.lastLoginDate = date;
            break;
        }

        case 'SET_THEME':
            user.theme = action.payload;
            break;

        case 'TOGGLE_HAPTICS':
            user.hapticsEnabled = !user.hapticsEnabled;
            break;

        case 'SET_AVATAR':
            user.avatarId = action.payload;
            break;

        case 'SET_NAME':
            user.name = action.payload;
            break;

        case 'RESET_HABIT_COUNTS':
            newState.habits = state.habits.map(h => ({
                ...h,
                countPositive: 0,
                countNegative: 0
            }));
            break;

        case 'SET_AUTO_SHIELD':
            user.autoShieldEnabled = action.payload;
            break;

        case 'SET_NOTIFICATION_SETTINGS':
            user.notificationSettings = {
                ...user.notificationSettings,
                ...action.payload
            };
            break;

        case 'BUY_REWARD':
            const { cost, currency, name, category, id } = action.payload;
            if (currency === 'gold') {
                if (user.gold >= cost) {
                    user.gold -= cost;
                    newState.purchases = [
                        { id, name, cost, currency, category, date: new Date().toISOString() },
                        ...state.purchases
                    ];
                    triggerHaptics('success', user.hapticsEnabled);
                }
            } else {
                if (user.gems >= cost) {
                    user.gems -= cost;
                    if (id === 'e_shield') {
                        user.streakShields = (user.streakShields || 0) + 1;
                    }
                    if (id === 'e5_gold_boost') {
                        const current = user.goldMultiplier || 1;
                        let increment = 0;
                        if (current < 1.1) increment = 0.20;
                        else if (current < 1.3) increment = 0.15;
                        else if (current < 1.4) increment = 0.10;
                        if (current + increment <= 1.5) {
                            user.goldMultiplier = current + increment;
                        }
                    }
                    newState.purchases = [
                        { id, name, cost, currency, category, date: new Date().toISOString() },
                        ...state.purchases
                    ];
                    triggerHaptics('success', user.hapticsEnabled);
                }
            }
            break;

        case 'ADD_REWARD':
            newState.customRewards = [action.payload, ...state.customRewards];
            break;

        case 'COMPLETE_ONBOARDING':
            user.hasSeenOnboarding = true;
            break;

        case 'LOAD_STATE':
            return {
                ...INITIAL_STATE,
                ...action.payload,
                user: {
                    ...INITIAL_STATE.user,
                    ...(action.payload.user || {})
                },
                dailyStats: action.payload.dailyStats || {},
            };

        default:
            return state;
    }

    // ============================================
    // LEVEL UP / DEATH LOGIC
    // ============================================
    if (user.xp >= user.maxXp) {
        user.level += 1;
        user.gems += 5;
        user.xp = user.xp - user.maxXp;
        user.maxXp = Math.floor(user.maxXp * 1.25);
        user.hp = user.maxHp;
        triggerHaptics('success', user.hapticsEnabled);
    }

    if (user.hp <= 0) {
        user.hp = MAX_HP;
        user.level = Math.max(1, user.level - 1);
        user.xp = 0;
        user.gold = Math.floor(user.gold * 0.5);
        triggerHaptics('error', user.hapticsEnabled);
    }

    newState.user = user;
    return newState;
};

// ============================================
// CONTEXT SETUP
// ============================================
export const GameContext = createContext<{
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    isLoaded: boolean;
}>({ state: INITIAL_STATE, dispatch: () => { }, isLoaded: false });

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
    const [isLoaded, setIsLoaded] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedSave = (newState: GameState) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(e => console.error(e));
        }, 300);
    };

    const wrappedDispatch = React.useCallback((action: GameAction) => {
        dispatch(action);
    }, []);

    useEffect(() => {
        debouncedSave(state);
    }, [state]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    dispatch({ type: 'LOAD_STATE', payload: parsed });
                }
            } catch (e) {
                console.error("Failed to load game state", e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const checkDailyReset = () => {
            if (!state.lastLoginDate) return;
            const now = new Date();
            const resetHour = 5;
            const gameDate = now.getHours() < resetHour
                ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
                : now;
            const todayStr = format(gameDate, 'yyyy-MM-dd');

            if (state.lastLoginDate !== todayStr) {
                dispatch({ type: 'DAILY_RESET', payload: { date: todayStr } });
            }
        };

        checkDailyReset();
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkDailyReset();
            }
        });
        return () => {
            subscription.remove();
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [state.lastLoginDate]);

    return (
        <GameContext.Provider value={{ state, dispatch: wrappedDispatch, isLoaded }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
