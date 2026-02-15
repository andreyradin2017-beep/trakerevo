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
  },
  {
    id: "cinephile_novice",
    title: "Начинающий киноман",
    description: "Посмотрите 5 фильмов.",
    icon: Film,
    color: "#a78bfa", // violet-400
    condition: (stats) => stats.moviesWatched >= 5,
  },
  {
    id: "bookworm_novice",
    title: "Книжный червь",
    description: "Прочитайте 5 книг.",
    icon: BookOpen,
    color: "#f472b6", // pink-400
    condition: (stats) => stats.booksRead >= 5,
  },
  {
    id: "gamer_novice",
    title: "Геймер",
    description: "Пройдите 5 игр.",
    icon: Gamepad2,
    color: "#34d399", // emerald-400
    condition: (stats) => stats.gamesPlayed >= 5,
  },
  {
    id: "streak_master",
    title: "Постоялец",
    description: "Заходите в приложение 3 дня подряд.",
    icon: Zap,
    color: "#f59e0b", // orange-500
    condition: (stats) => stats.streak >= 3,
  },
  {
    id: "completionist",
    title: "Коллекционер",
    description: "Соберите 50 завершенных элементов.",
    icon: Trophy,
    color: "#ffd700", // gold
    condition: (stats) => stats.totalCompleted >= 50,
  },
  {
    id: "streak_guru",
    title: "Гуру постоянства",
    description: "Заходите в приложение 7 дней подряд.",
    icon: Target,
    color: "#ef4444", // red-500
    condition: (stats) => stats.streak >= 7,
  },
];

export const getUnlockedAchievements = (stats: UserStats): string[] => {
  return ACHIEVEMENTS.filter((a) => a.condition(stats)).map((a) => a.id);
};

export const getAchievementProgress = (
  achievementId: string,
  stats: UserStats,
): number => {
  // Optional: Return percentage 0-100 for progress bars
  // Simplified implementation for now
  // Suppress unused variable warning by referencing them
  return achievementId && stats ? 0 : 0;
};
