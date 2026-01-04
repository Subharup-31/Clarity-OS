export type TaskType = 'habit' | 'daily' | 'todo';
export type BehaviorType = 'positive' | 'negative';

export interface Task {
    id: string;
    title: string;
    notes?: string;
    type: TaskType;
    createdAt: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface Habit extends Task {
    type: 'habit';
    behaviorType: BehaviorType; // positive = do it, negative = avoid it
    countPositive: number;
    countNegative: number;
    strength: number;
    // Anti-exploit: Daily scoring limit
    lastScoredDate?: string; // YYYY-MM-DD
    todayPositiveCount?: number; // Positive: max 5/day, Negative: max 1/day
    todayNegativeCount?: number;
    // Soft-delete: still visible in past dates after deletion
    deletedAt?: number;
}

export interface Daily extends Task {
    type: 'daily';
    completed: boolean;
    streak: number;
    lastCompletedDate?: string;
    // Anti-exploit: Track completion timestamp
    completedAt?: number;
    // Soft-delete: still visible in past dates after deletion
    deletedAt?: number;
}

export interface Todo extends Task {
    type: 'todo';
    completed: boolean;
    dueDate?: number;
    rescheduleCount?: number;
    originalDueDate?: number;
}

// ============================================
// NOTIFICATION SETTINGS
// ============================================
export interface NotificationSettings {
    enabled: boolean;
    morningTime: string; // "09:00"
    eveningTime: string; // "20:00"
    lastScheduledAt?: number; // Prevent re-scheduling every launch
}

// ============================================
// DAILY STATS (for Weekly Review)
// ============================================
export interface DailyStat {
    date: string; // YYYY-MM-DD
    completedPositive: number;
    totalPositive: number;
    cleanNegative: number; // Days where user successfully avoided
    totalNegative: number;
    goldEarned: number;
    xpEarned: number;
}

// ============================================
// USER STATS
// ============================================
export interface UserStats {
    hp: number;
    maxHp: number;
    xp: number;
    maxXp: number;
    level: number;
    gold: number;
    gems: number;
    theme: string;
    hapticsEnabled: boolean;
    avatarId: string;
    name: string;
    streakShields: number;
    goldMultiplier?: number;

    // Auto-Shield
    autoShieldEnabled: boolean;
    lastAutoShieldDate?: string; // For notification

    // Notification Settings
    notificationSettings: NotificationSettings;

    // Daily tracking
    todayGoldEarned?: number;
    todayXpEarned?: number;
    lastEarnDate?: string;

    // Onboarding
    hasSeenOnboarding: boolean;
}

// ============================================
// GAME ACTIONS
// ============================================
export type GameAction =
    | { type: 'ADD_TASK'; payload: Habit | Daily | Todo }
    | { type: 'DELETE_TASK'; payload: { id: string; type: TaskType } }
    | { type: 'SOFT_DELETE_TASK'; payload: { id: string; type: TaskType } }
    | { type: 'UPDATE_TASK'; payload: { id: string; data: Partial<Habit | Daily | Todo> } }
    | { type: 'COMPLETE_TODO'; payload: string }
    | { type: 'TOGGLE_DAILY'; payload: string }
    | { type: 'SCORE_HABIT'; payload: { id: string; direction: 'positive' | 'negative' } }
    | { type: 'DAILY_RESET'; payload: { date: string } }
    | { type: 'RESCHEDULE_TODO'; payload: { id: string; newDate?: number } }
    | { type: 'SET_THEME'; payload: string }
    | { type: 'SET_AVATAR'; payload: string }
    | { type: 'SET_NAME'; payload: string }
    | { type: 'TOGGLE_HAPTICS' }
    | { type: 'RESET_HABIT_COUNTS' }
    | { type: 'LOAD_STATE'; payload: GameState }
    | { type: 'BUY_REWARD'; payload: ShopItem }
    | { type: 'ADD_REWARD'; payload: ShopItem }
    | { type: 'SET_AUTO_SHIELD'; payload: boolean }
    | { type: 'SET_NOTIFICATION_SETTINGS'; payload: Partial<NotificationSettings> }
    | { type: 'COMPLETE_ONBOARDING' };

// ============================================
// SHOP
// ============================================
export interface ShopItem {
    id: string;
    name: string;
    cost: number;
    currency: 'gold' | 'gems';
    category: string;
}

export interface Purchase {
    id: string;
    name: string;
    cost: number;
    currency: 'gold' | 'gems';
    date: string;
    category: string;
}

// ============================================
// GAME STATE
// ============================================
export interface GameState {
    user: UserStats;
    habits: Habit[];
    dailies: Daily[];
    todos: Todo[];
    lastLoginDate: string; // YYYY-MM-DD
    history: Record<string, { status: 'success' | 'fail' | 'partial' }>;
    purchases: Purchase[];
    customRewards: ShopItem[];
    dailyStats: Record<string, DailyStat>; // Keyed by YYYY-MM-DD
}
