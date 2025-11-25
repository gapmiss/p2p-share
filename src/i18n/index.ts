import { moment } from 'obsidian';
import { en } from './locales/en';
import { fr } from './locales/fr';

export type TranslationKey = keyof typeof en;

const translations = {
	en,
	fr,
} as const;

type SupportedLocale = keyof typeof translations;

/**
 * Get the current locale from Obsidian
 */
function getCurrentLocale(): SupportedLocale {
	const locale = moment.locale();
	// moment.locale() returns the current locale (e.g., 'en', 'fr', 'es')
	// If locale is not supported, fall back to 'en'
	if (locale.startsWith('fr')) return 'fr';
	return 'en';
}

/**
 * Translate a key to the current locale
 */
export function t(key: TranslationKey, ...args: (string | number)[]): string {
	const locale = getCurrentLocale();
	const translation = translations[locale][key] || translations.en[key];

	// Simple template replacement for {0}, {1}, etc.
	if (args.length > 0) {
		return translation.replace(/\{(\d+)\}/g, (match, index) => {
			const argIndex = parseInt(index);
			return args[argIndex] !== undefined ? String(args[argIndex]) : match;
		});
	}

	return translation;
}

/**
 * Translate a pluralized string
 * @param key The translation key
 * @param count The count to use for pluralization
 * @param args Additional arguments for template replacement
 */
export function tp(key: TranslationKey, count: number, ...args: (string | number)[]): string {
	const locale = getCurrentLocale();
	const translation = translations[locale][key] || translations.en[key];

	// Determine the plural suffix
	let pluralSuffix = '';
	if (locale === 'en') {
		pluralSuffix = count !== 1 ? 's' : '';
	} else if (locale === 'fr') {
		pluralSuffix = count > 1 ? 's' : '';
	}

	// Build the replacement array with count as first argument and plural suffix as second
	const allArgs = [count, pluralSuffix, ...args];

	// Replace template variables {0}, {1}, etc.
	return translation.replace(/\{(\d+)\}/g, (match, index) => {
		const argIndex = parseInt(index);
		return allArgs[argIndex] !== undefined ? String(allArgs[argIndex]) : match;
	});
}
