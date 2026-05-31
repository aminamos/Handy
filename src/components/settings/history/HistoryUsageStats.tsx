import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { DailyWordCount, HistoryUsageStats } from "@/bindings";
import { SettingsGroup } from "@/components/ui/SettingsGroup";

interface HistoryUsageStatsPanelProps {
  stats: HistoryUsageStats | null;
  loading: boolean;
}

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const chunkWeeks = (days: DailyWordCount[]) => {
  const weeks: DailyWordCount[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
};

const levelClassName = (words: number, maxWords: number, isFuture: boolean) => {
  if (isFuture) {
    return "bg-transparent border border-dashed border-mid-gray/10";
  }

  if (words === 0 || maxWords === 0) {
    return "bg-mid-gray/10 border border-mid-gray/5";
  }

  const ratio = words / maxWords;
  if (ratio >= 0.75) return "bg-logo-primary border border-logo-primary/70";
  if (ratio >= 0.5) return "bg-logo-primary/70 border border-logo-primary/50";
  if (ratio >= 0.25) return "bg-logo-primary/45 border border-logo-primary/40";
  return "bg-logo-primary/20 border border-logo-primary/30";
};

const SummaryCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-mid-gray/20 bg-mid-gray/5 px-4 py-3">
    <div className="text-xs uppercase tracking-wide text-mid-gray">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-text">{value.toLocaleString()}</div>
  </div>
);

export const HistoryUsageStatsPanel: React.FC<HistoryUsageStatsPanelProps> = ({
  stats,
  loading,
}) => {
  const { t, i18n } = useTranslation();

  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: "short",
      }),
    [i18n.language],
  );

  const dayTitleFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [i18n.language],
  );

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: "short",
      }),
    [i18n.language],
  );

  const weekFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: "short",
        day: "numeric",
      }),
    [i18n.language],
  );

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        weekdayFormatter.format(new Date(2026, 5, index + 1)),
      ),
    [weekdayFormatter],
  );

  const weeks = useMemo(() => chunkWeeks(stats?.daily_word_counts ?? []), [stats]);
  const maxWords = useMemo(
    () => Math.max(...(stats?.daily_word_counts ?? []).map((day) => day.words), 0),
    [stats],
  );

  const monthLabels = useMemo(
    () =>
      weeks.map((week, index) => {
        const firstDay = week[0];
        if (!firstDay) return "";
        const currentMonth = parseDateKey(firstDay.date).getMonth();
        const previousMonth =
          index === 0 || !weeks[index - 1][0]
            ? null
            : parseDateKey(weeks[index - 1][0].date).getMonth();
        return previousMonth === currentMonth
          ? ""
          : monthFormatter.format(parseDateKey(firstDay.date));
      }),
    [monthFormatter, weeks],
  );

  const recentDays = useMemo(
    () =>
      (stats?.daily_word_counts ?? [])
        .filter((day) => day.date <= (stats?.today ?? ""))
        .slice(-7),
    [stats],
  );

  const recentWeeks = stats?.weekly_word_counts ?? [];

  return (
    <SettingsGroup
      title={t("settings.history.metrics.title")}
      description={t("settings.history.metrics.description")}
    >
      <div className="space-y-5 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label={t("settings.history.metrics.today")}
            value={stats?.today_words ?? 0}
          />
          <SummaryCard
            label={t("settings.history.metrics.thisWeek")}
            value={stats?.this_week_words ?? 0}
          />
          <SummaryCard
            label={t("settings.history.metrics.total")}
            value={stats?.total_words ?? 0}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-text">
              {t("settings.history.metrics.recentWeeks")}
            </h3>
            {loading && (
              <span className="text-xs text-mid-gray">
                {t("settings.history.metrics.loading")}
              </span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {recentWeeks.map((week) => {
              const weekStart = parseDateKey(week.week_start);
              return (
                <div
                  key={week.week_start}
                  className="rounded-lg border border-mid-gray/20 bg-mid-gray/5 px-3 py-2"
                >
                  <div className="text-xs uppercase tracking-wide text-mid-gray">
                    {weekFormatter.format(weekStart)}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-text">
                    {week.words.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text">
            {t("settings.history.metrics.recentDays")}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {recentDays.map((day) => {
              const dayDate = parseDateKey(day.date);
              return (
                <div
                  key={day.date}
                  className="rounded-lg border border-mid-gray/20 bg-mid-gray/5 px-3 py-2"
                >
                  <div className="text-xs uppercase tracking-wide text-mid-gray">
                    {dayTitleFormatter.format(dayDate)}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-text">
                    {day.words.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-text">
              {t("settings.history.metrics.consistency")}
            </h3>
            <div className="flex items-center gap-2 text-xs text-mid-gray">
              <span>{t("settings.history.metrics.less")}</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((level) => {
                  const sampleWords =
                    level === 0 ? 0 : Math.max(1, Math.ceil((maxWords * level) / 4));
                  return (
                    <span
                      key={level}
                      className={`h-3 w-3 rounded-[3px] ${levelClassName(sampleWords, maxWords, false)}`}
                    />
                  );
                })}
              </div>
              <span>{t("settings.history.metrics.more")}</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="inline-flex min-w-max flex-col gap-2">
              <div className="ml-12 grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
                {monthLabels.map((label, index) => (
                  <div key={`${index}-${label}`} className="h-4 text-[10px] uppercase tracking-wide text-mid-gray">
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="grid gap-1 pt-[2px] text-[10px] uppercase tracking-wide text-mid-gray">
                  {weekdayLabels.map((label) => (
                    <div key={label} className="flex h-3 items-center justify-end pr-1">
                      {label}
                    </div>
                  ))}
                </div>

                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
                >
                  {weeks.map((week, weekIndex) => (
                    <div key={`week-${weekIndex}`} className="grid gap-1">
                      {week.map((day) => {
                        const isFuture = day.date > (stats?.today ?? "");
                        const dayDate = parseDateKey(day.date);
                        const title = t("settings.history.metrics.dayTooltip", {
                          date: dayTitleFormatter.format(dayDate),
                          count: day.words,
                        });

                        return (
                          <div
                            key={day.date}
                            title={title}
                            aria-label={title}
                            className={`h-3 w-3 rounded-[3px] ${levelClassName(day.words, maxWords, isFuture)}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsGroup>
  );
};
