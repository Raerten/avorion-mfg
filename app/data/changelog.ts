export interface ChangelogEntry {
  date: string
  changes: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-04-10',
    changes: [
      'Управление несколькими канвасами поставок',
      'Страница журнала изменений с отображением версии в футере',
    ],
  },
  {
    date: '2026-04-08',
    changes: [
      'Начальный релиз',
      'Справочник фабрик с поиском и фильтрацией',
      'Визуализация цепей поставок',
    ],
  },
]

export const APP_VERSION = changelog[0]!.date.replaceAll('-', '')
