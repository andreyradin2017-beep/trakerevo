import {
  Trophy,
  Film,
  BookOpen,
  Gamepad2,
  Zap,
  Star,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  condition: (stats: UserStats) => boolean;
  target?: (stats: UserStats) => number; // Target value for progress
  current?: (stats: UserStats) => number; // Current value for progress
}

export interface UserStats {
  moviesWatched: number;
  booksRead: number;
  gamesPlayed: number;
  totalCompleted: number;
  streak: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_step",
    title: "Первый шаг",
    description: "Завершите свой первый элемент в любой категории.",
    icon: Star,
    color: "#fbbf24", // amber-400
    condition: (stats) => stats.totalCompleted >= 1,
    target: () => 1,
    current: (stats) => stats.totalCompleted,
  },
  {
    id: "cinephile_novice",
    title: "Начинающий киноман",
    description: "Посмотрите 5 фильмов.",
    icon: Film,
    color: "#a78bfa", // violet-400
    condition: (stats) => stats.moviesWatched >= 5,
    target: () => 5,
    current: (stats) => stats.moviesWatched,
  },
  {
    id: "bookworm_novice",
    title: "Книжный червь",
    description: "Прочитайте 5 книг.",
    icon: BookOpen,
    color: "#f472b6", // pink-400
    condition: (stats) => stats.booksRead >= 5,
    target: () => 5,
    current: (stats) => stats.booksRead,
  },
  {
    id: "gamer_novice",
    title: "Геймер",
    description: "Пройдите 5 игр.",
    icon: Gamepad2,
    color: "#34d399", // emerald-400
    condition: (stats) => stats.gamesPlayed >= 5,
    target: () => 5,
    current: (stats) => stats.gamesPlayed,
  },
  {
    id: "streak_master",
    title: "Постоялец",
    description: "Заходите в приложение 3 дня подряд.",
    icon: Zap,
    color: "#f59e0b", // orange-500
    condition: (stats) => stats.streak >= 3,
    target: () => 3,
    current: (stats) => stats.streak,
  },
  {
    id: "completionist",
    title: "Коллекционер",
    description: "Соберите 50 завершенных элементов.",
    icon: Trophy,
    color: "#ffd700", // gold
    condition: (stats) => stats.totalCompleted >= 50,
    target: () => 50,
    current: (stats) => stats.totalCompleted,
  },
  {
    id: "streak_guru",
    title: "Гуру постоянства",
    description: "Заходите в приложение 7 дней подряд.",
    icon: Target,
    color: "#ef4444", // red-500
    condition: (stats) => stats.streak >= 7,
    target: () => 7,
    current: (stats) => stats.streak,
  },
];

export const getUnlockedAchievements = (stats: UserStats): string[] => {
  return ACHIEVEMENTS.filter((a) => a.condition(stats)).map((a) => a.id);
};

export const getAchievementProgress = (
  achievementId: string,
  stats: UserStats,
): { current: number; target: number; percentage: number } => {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement || !achievement.current || !achievement.target) {
    return { current: 0, target: 1, percentage: 0 };
  }

  const current = achievement.current(stats);
  const target = achievement.target(stats);
  const percentage = Math.min(100, Math.round((current / target) * 100));

  return { current, target, percentage };
};
