import { useState, useEffect } from "react";

interface StreakData {
  currentStreak: number;
  maxStreak: number;
  lastLoginDate: string | null;
}

export const useStreaks = () => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    maxStreak: 0,
    lastLoginDate: null,
  });
  const [showFireAnimation, setShowFireAnimation] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem("trakerevo_streaks");
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format

    let data: StreakData = storedData
      ? JSON.parse(storedData)
      : { currentStreak: 0, maxStreak: 0, lastLoginDate: null };

    // If already logged in today, just load state
    if (data.lastLoginDate === today) {
      setStreakData(data);
      return;
    }

    // Logic to calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toLocaleDateString("en-CA");

    if (data.lastLoginDate === yesterdayString) {
      // Continued streak
      data.currentStreak += 1;
      setShowFireAnimation(true); // Trigger animation for extending streak
    } else if (data.lastLoginDate !== today) {
      // Broken streak or first time
      data.currentStreak = 1;
      setShowFireAnimation(true); // Trigger animation for new day
    }

    // Update max streak
    if (data.currentStreak > data.maxStreak) {
      data.maxStreak = data.currentStreak;
    }

    data.lastLoginDate = today;

    // Save and Update State
    localStorage.setItem("trakerevo_streaks", JSON.stringify(data));
    setStreakData(data);

    // Turn off animation after a few seconds
    const timer = setTimeout(() => setShowFireAnimation(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return { ...streakData, showFireAnimation };
};
