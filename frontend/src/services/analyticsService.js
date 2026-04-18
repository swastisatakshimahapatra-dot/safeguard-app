// ✅ Calculate analytics from alert history

// ✅ Get day name
const getDayName = (dateString) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateString).getDay()];
};

// ✅ Get hour from date
const getHour = (dateString) => {
  return new Date(dateString).getHours();
};

// ✅ Main analytics calculator
export const calculateAnalytics = (alerts) => {
  if (!alerts || alerts.length === 0) {
    return {
      totalAlerts: 0,
      thisWeekAlerts: 0,
      thisMonthAlerts: 0,
      safeDaysStreak: 0,
      mostActiveDay: 'No data',
      mostActiveHour: 'No data',
      successRate: 0,
      avgResponseContacts: 0,
      alertsByType: {},
      alertsByDay: {},
      alertsByHour: {},
      recentTrend: 'safe',
      lastAlertDaysAgo: null,
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  // ✅ This week alerts
  const thisWeekAlerts = alerts.filter(
    (a) => new Date(a.createdAt) >= oneWeekAgo
  ).length;

  // ✅ This month alerts
  const thisMonthAlerts = alerts.filter(
    (a) => new Date(a.createdAt) >= oneMonthAgo
  ).length;

  // ✅ Alerts by day of week
  const alertsByDay = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach((d) => (alertsByDay[d] = 0));
  alerts.forEach((a) => {
    const day = dayNames[new Date(a.createdAt).getDay()];
    alertsByDay[day] = (alertsByDay[day] || 0) + 1;
  });

  // ✅ Most active day
  const mostActiveDay = Object.entries(alertsByDay).reduce(
    (max, [day, count]) => (count > max.count ? { day, count } : max),
    { day: 'None', count: 0 }
  );

  // ✅ Alerts by hour
  const alertsByHour = {};
  alerts.forEach((a) => {
    const hour = getHour(a.createdAt);
    const label =
      hour === 0
        ? '12am'
        : hour < 12
        ? `${hour}am`
        : hour === 12
        ? '12pm'
        : `${hour - 12}pm`;
    alertsByHour[label] = (alertsByHour[label] || 0) + 1;
  });

  // ✅ Most active hour
  const mostActiveHour =
    Object.entries(alertsByHour).length > 0
      ? Object.entries(alertsByHour).reduce((max, [hour, count]) =>
          count > max.count ? { hour, count } : max,
          { hour: 'None', count: 0 }
        )
      : { hour: 'None', count: 0 };

  // ✅ Success rate
  const sentAlerts = alerts.filter(
    (a) => a.status === 'Sent' || a.status === 'Partial'
  ).length;
  const successRate =
    alerts.length > 0 ? Math.round((sentAlerts / alerts.length) * 100) : 0;

  // ✅ Average contacts notified
  const totalContacts = alerts.reduce(
    (sum, a) => sum + (a.contactsNotified?.length || 0),
    0
  );
  const avgContacts =
    alerts.length > 0 ? (totalContacts / alerts.length).toFixed(1) : 0;

  // ✅ Safe days streak
  const lastAlert = alerts[0]; // Already sorted by newest first
  let safeDaysStreak = 0;
  if (lastAlert) {
    const lastAlertDate = new Date(lastAlert.createdAt);
    const diffMs = now - lastAlertDate;
    safeDaysStreak = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } else {
    safeDaysStreak = 0;
  }

  // ✅ Last alert days ago
  const lastAlertDaysAgo = lastAlert
    ? Math.floor((now - new Date(lastAlert.createdAt)) / (1000 * 60 * 60 * 24))
    : null;

  // ✅ Recent trend
  const last7Days = alerts.filter((a) => new Date(a.createdAt) >= oneWeekAgo).length;
  const prev7Days = alerts.filter((a) => {
    const date = new Date(a.createdAt);
    return date >= new Date(now - 14 * 24 * 60 * 60 * 1000) && date < oneWeekAgo;
  }).length;

  let recentTrend = 'stable';
  if (last7Days > prev7Days) recentTrend = 'increasing';
  else if (last7Days < prev7Days) recentTrend = 'decreasing';
  else if (last7Days === 0) recentTrend = 'safe';

  // ✅ Alerts by type
  const alertsByType = {};
  alerts.forEach((a) => {
    alertsByType[a.type] = (alertsByType[a.type] || 0) + 1;
  });

  return {
    totalAlerts: alerts.length,
    thisWeekAlerts,
    thisMonthAlerts,
    safeDaysStreak,
    mostActiveDay: mostActiveDay.count > 0 ? mostActiveDay.day : 'No alerts',
    mostActiveHour: mostActiveHour.count > 0 ? mostActiveHour.hour : 'No alerts',
    successRate,
    avgResponseContacts: avgContacts,
    alertsByDay,
    alertsByHour,
    alertsByType,
    recentTrend,
    lastAlertDaysAgo,
  };
};

// ✅ Get safety score (0-100)
export const getSafetyScore = (analytics) => {
  let score = 100;

  // Deduct for recent alerts
  score -= analytics.thisWeekAlerts * 10;
  score -= analytics.thisMonthAlerts * 2;

  // Add for safe days
  score += Math.min(analytics.safeDaysStreak * 2, 20);

  // Ensure between 0-100
  return Math.max(0, Math.min(100, score));
};

// ✅ Get trend label
export const getTrendConfig = (trend) => {
  switch (trend) {
    case 'increasing':
      return {
        label: 'Alerts Increasing',
        color: 'text-red-500',
        bg: 'bg-red-50',
        icon: '📈',
      };
    case 'decreasing':
      return {
        label: 'Getting Safer',
        color: 'text-green-500',
        bg: 'bg-green-50',
        icon: '📉',
      };
    case 'safe':
      return {
        label: 'All Safe',
        color: 'text-green-600',
        bg: 'bg-green-50',
        icon: '✅',
      };
    default:
      return {
        label: 'Stable',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        icon: '➡️',
      };
  }
};