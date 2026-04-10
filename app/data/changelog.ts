export interface ChangelogEntry {
  date: string
  changes: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-04-10',
    changes: [
      'Поделиться схемой по ссылке',
      'Управление несколькими схемами производства',
      'Страница журнала изменений с отображением версии в футере',
    ],
  },
  {
    date: '2026-04-08',
    changes: [
      'Начальный релиз',
      'Справочник фабрик с поиском и фильтрацией',
      'Визуализация плана производства',
    ],
  },
]

export const APP_VERSION = changelog[0]!.date.replaceAll('-', '')
