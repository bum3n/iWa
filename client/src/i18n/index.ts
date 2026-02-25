import { ru } from './ru'
import { en } from './en'

export type Lang = 'ru' | 'en'
export type Translations = typeof ru

export const translations: Record<Lang, Translations> = { ru, en }

export { ru, en }
