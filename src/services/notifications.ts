import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationSchedule {
    enabled: boolean;
    morningTime: string; // "HH:mm"
    eveningTime: string; // "HH:mm"
    themeColor?: string; // Theme primary color for Android notification light
}

/**
 * Request notification permissions and set up Android channel with theme color
 */
export async function requestNotificationPermissions(themeColor: string = '#6366f1'): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
    }

    // Required for Android - use theme color for notification light
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Clarity OS Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: themeColor,
        });
    }

    return true;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Parse time string "HH:mm" into hours and minutes
 */
function parseTime(time: string): { hours: number; minutes: number } {
    const [hours, minutes] = time.split(':').map(Number);
    return { hours, minutes };
}

// Morning notification message pool - gentle, encouraging
const MORNING_MESSAGES = [
    { title: '☀️ Good morning!', body: 'A fresh start awaits. What will you accomplish today?' },
    { title: '🌅 Rise and shine!', body: 'Your dailies are ready when you are.' },
    { title: '✨ New day, new chances', body: 'Take a moment to plan your quests.' },
    { title: '🌻 Morning check-in', body: 'Small steps lead to big progress.' },
    { title: '🎯 Ready for today?', body: 'Your journey continues. No rush.' },
    { title: '🌄 A new adventure begins', body: 'Check in when you are ready.' },
    { title: '☕ Time to start fresh', body: 'What is one thing you want to accomplish?' },
    { title: '🌞 The day is yours', body: 'Your quests await whenever you are ready.' },
];

// Evening notification message pool - gentle reminders, no pressure
const EVENING_MESSAGES = [
    { title: '🌙 Evening check-in', body: 'How did your quests go today?' },
    { title: '🌆 Wrapping up?', body: 'A good time to review your dailies.' },
    { title: '✨ Almost there', body: 'Any unfinished quests? No pressure.' },
    { title: '🌃 End of day ritual', body: 'Celebrate what you accomplished!' },
    { title: '🌙 Winding down', body: 'Mark off what you completed today.' },
    { title: '🎑 Evening reflection', body: 'Every small win counts.' },
    { title: '🌠 Day is ending', body: 'Rest well. Tomorrow is another chance.' },
    { title: '🌛 Gentle reminder', body: 'Check your progress when you have a moment.' },
];

/**
 * Get a random message from a pool
 */
function getRandomMessage(pool: { title: string; body: string }[]): { title: string; body: string } {
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Schedule daily notifications based on settings
 */
export async function scheduleNotifications(settings: NotificationSchedule): Promise<void> {
    // Cancel all existing notifications first
    await cancelAllNotifications();

    if (!settings.enabled) {
        return;
    }

    // Request permissions if not granted, pass theme color for Android
    const themeColor = settings.themeColor || '#6366f1';
    const hasPermission = await requestNotificationPermissions(themeColor);
    if (!hasPermission) {
        return;
    }

    const morningTime = parseTime(settings.morningTime);
    const eveningTime = parseTime(settings.eveningTime);

    // Get random messages for variety
    const morningMessage = getRandomMessage(MORNING_MESSAGES);
    const eveningMessage = getRandomMessage(EVENING_MESSAGES);

    // Check if morning and evening are the same time
    const sameTime = settings.morningTime === settings.eveningTime;

    // Schedule morning notification
    await Notifications.scheduleNotificationAsync({
        identifier: 'clarity-morning', // Unique ID prevents duplicates
        content: {
            title: morningMessage.title,
            body: morningMessage.body,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: morningTime.hours,
            minute: morningTime.minutes,
        },
    });

    // Only schedule evening notification if it's at a different time
    if (!sameTime) {
        await Notifications.scheduleNotificationAsync({
            identifier: 'clarity-evening', // Unique ID prevents duplicates
            content: {
                title: eveningMessage.title,
                body: eveningMessage.body,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: eveningTime.hours,
                minute: eveningTime.minutes,
            },
        });
        console.log(`Scheduled notifications: Morning at ${settings.morningTime}, Evening at ${settings.eveningTime}`);
    } else {
        console.log(`Scheduled single notification at ${settings.morningTime} (morning and evening times are the same)`);
    }
}

/**
 * Get list of scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
}

