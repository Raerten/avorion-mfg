import { APP_VERSION } from '~/data/changelog'

const STORAGE_KEY = 'avorion-mfg-seen-version'

const hasUpdate = ref(false)

export function useVersionNotice() {
  const seenVersion = localStorage.getItem(STORAGE_KEY)
  hasUpdate.value = seenVersion !== APP_VERSION

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, APP_VERSION)
    hasUpdate.value = false
  }

  return { hasUpdate: readonly(hasUpdate), dismiss }
}
