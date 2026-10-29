import { reactive, watch } from 'vue'

export type CustomPalette = {
	background: string
	buttons: string
	accent: string
	text: string
}

const storageKey = 'fakedrinth.custom-palette.v1'
const defaults: CustomPalette = {
	background: '#171315',
	buttons: '#d61f32',
	accent: '#ff5361',
	text: '#f4edf0',
}

function isHexColor(value: unknown): value is string {
	return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

function loadPalette(): CustomPalette {
	try {
		const stored = localStorage.getItem(storageKey)
		if (stored) {
			const value = JSON.parse(stored) as Partial<CustomPalette>
			return {
				background: isHexColor(value.background) ? value.background : defaults.background,
				buttons: isHexColor(value.buttons) ? value.buttons : defaults.buttons,
				accent: isHexColor(value.accent) ? value.accent : defaults.accent,
				text: isHexColor(value.text) ? value.text : defaults.text,
			}
		}
	} catch {
		// Keep usable defaults if browser storage is unavailable or malformed.
	}
	return { ...defaults }
}

const palette = reactive(loadPalette())

function applyPalette(value: CustomPalette) {
	if (typeof document === 'undefined') return
	const root = document.documentElement
	const channels =
		value.buttons.match(/[a-f\d]{2}/gi)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? []
	const luminance =
		channels.length === 3
			? channels
					.map((channel) =>
						channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
					)
					.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
			: 0
	root.style.setProperty('--fakedrinth-background', value.background)
	root.style.setProperty('--fakedrinth-buttons', value.buttons)
	root.style.setProperty('--fakedrinth-button-text', luminance > 0.42 ? '#171315' : '#ffffff')
	root.style.setProperty('--fakedrinth-accent', value.accent)
	root.style.setProperty('--fakedrinth-text', value.text)
	root.classList.add('fakedrinth-palette')

	let overrides = document.getElementById('fakedrinth-palette-overrides') as HTMLStyleElement | null
	if (!overrides) {
		overrides = document.createElement('style')
		overrides.id = 'fakedrinth-palette-overrides'
		document.head.append(overrides)
	}
	const globalColorRules = `
		html.fakedrinth-palette,
		html.fakedrinth-palette *,
		html.fakedrinth-palette .app-grid-layout * {
			--surface-1: var(--fakedrinth-background) !important;
			--surface-1-5: color-mix(in srgb, var(--fakedrinth-background) 96%, white 4%) !important;
			--surface-2: color-mix(in srgb, var(--fakedrinth-background) 92%, white 8%) !important;
			--surface-2-5: color-mix(in srgb, var(--fakedrinth-background) 88%, white 12%) !important;
			--surface-3: color-mix(in srgb, var(--fakedrinth-background) 83%, white 17%) !important;
			--surface-4: color-mix(in srgb, var(--fakedrinth-background) 76%, white 24%) !important;
			--surface-5: color-mix(in srgb, var(--fakedrinth-background) 66%, white 34%) !important;
			--color-green-50: color-mix(in srgb, var(--fakedrinth-buttons) 10%, white) !important;
			--color-green-100: color-mix(in srgb, var(--fakedrinth-buttons) 20%, white) !important;
			--color-green-200: color-mix(in srgb, var(--fakedrinth-buttons) 35%, white) !important;
			--color-green-300: color-mix(in srgb, var(--fakedrinth-buttons) 50%, white) !important;
			--color-green-400: color-mix(in srgb, var(--fakedrinth-buttons) 75%, white) !important;
			--color-green-500: var(--fakedrinth-buttons) !important;
			--color-green-600: color-mix(in srgb, var(--fakedrinth-buttons) 90%, black) !important;
			--color-green-700: color-mix(in srgb, var(--fakedrinth-buttons) 75%, black) !important;
			--color-green-800: color-mix(in srgb, var(--fakedrinth-buttons) 60%, black) !important;
			--color-green-900: color-mix(in srgb, var(--fakedrinth-buttons) 45%, black) !important;
			--color-green-950: color-mix(in srgb, var(--fakedrinth-buttons) 30%, black) !important;
			--color-green: var(--fakedrinth-buttons) !important;
			--color-green-highlight: color-mix(in srgb, var(--fakedrinth-buttons) 25%, transparent) !important;
			--color-green-bg: color-mix(in srgb, var(--fakedrinth-buttons) 18%, transparent) !important;
			--color-brand: var(--fakedrinth-accent) !important;
			--color-brand-highlight: color-mix(in srgb, var(--fakedrinth-accent) 25%, transparent) !important;
			--color-brand-shadow: color-mix(in srgb, var(--fakedrinth-accent) 55%, transparent) !important;
			--color-text-primary: var(--fakedrinth-text) !important;
			--color-text-default: var(--fakedrinth-text) !important;
			--color-text-tertiary: color-mix(in srgb, var(--fakedrinth-text) 72%, var(--fakedrinth-background)) !important;
			--color-base: var(--fakedrinth-text) !important;
			--color-secondary: color-mix(in srgb, var(--fakedrinth-text) 72%, var(--fakedrinth-background)) !important;
			--color-contrast: var(--fakedrinth-text) !important;
			--color-text: var(--fakedrinth-text) !important;
		}
		html.fakedrinth-palette .bg-green,
		html.fakedrinth-palette .hover\\:bg-green:hover,
		html.fakedrinth-palette [data-button].button-frame--colored,
		html.fakedrinth-palette [data-button].button-frame--colored-text,
		html.fakedrinth-palette .btn-green {
			--button-color: var(--fakedrinth-buttons) !important;
			--_background-color: var(--fakedrinth-buttons) !important;
			--_accent-color: var(--fakedrinth-buttons) !important;
			background-color: var(--fakedrinth-buttons) !important;
			color: var(--fakedrinth-button-text) !important;
		}
		html.fakedrinth-palette .bg-bg-green { background-color: var(--color-green-bg) !important; }
		html.fakedrinth-palette .bg-highlight-green { background-color: var(--color-green-highlight) !important; }
		html.fakedrinth-palette .app-grid-layout [data-button].modpack-update-button {
			--button-color: #15803d !important;
			--_background-color: #15803d !important;
			--_accent-color: #15803d !important;
			background-color: #15803d !important;
			color: #fff !important;
			box-shadow: 0 0 0 2px #86efac, 0 2px 10px rgb(0 0 0 / 28%) !important;
		}
		html.fakedrinth-palette .app-grid-layout [data-button].modpack-update-button:hover { filter: brightness(1.1); }
		html.fakedrinth-palette .app-grid-layout [data-button].modpack-update-button:focus-visible {
			outline: 3px solid #bbf7d0;
			outline-offset: 2px;
		}
		html.fakedrinth-palette .text-green,
		html.fakedrinth-palette .text-brand-green,
		html.fakedrinth-palette .border-green,
		html.fakedrinth-palette .border-brand-green {
			color: var(--fakedrinth-accent) !important;
			border-color: var(--fakedrinth-buttons) !important;
		}
	`
	overrides.textContent = globalColorRules
}

applyPalette(palette)
watch(
	palette,
	(value) => {
		applyPalette(value)
		try {
			localStorage.setItem(storageKey, JSON.stringify(value))
		} catch {
			// The selected colours still apply for this session.
		}
	},
	{ deep: true, flush: 'sync' },
)

export function useCustomPalette() {
	return palette
}
