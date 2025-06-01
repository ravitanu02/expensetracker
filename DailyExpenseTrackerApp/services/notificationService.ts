import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function scheduleDailyReminder(hour: number, minute: number) {
  try {
    console.log('Requesting notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('No existing permission, requesting...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    console.log('Cancelling any existing notifications...');
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule for the next occurrence
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0); // Set hours and minutes

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    console.log(`Scheduling notification for ${scheduledTime.toLocaleString()}`);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Track your expenses!',
        body: "Don't forget to log today's expenses.",
        sound: true,
        priority: 'high',
      },
      trigger: {
        hour: hour,
        minute: minute,
        repeats: true,
      },
    });

    console.log('Notification scheduled successfully with ID:', identifier);

    // Test immediate notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Reminder Set!',
        body: `Daily reminder will show at ${hour}:${minute.toString().padStart(2, '0')}`,
      },
      trigger: null, // This will show immediately
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}
