import { invoke } from '@tauri-apps/api/core'

import { get_default_user, users } from '@/helpers/auth.js'
import { list } from '@/helpers/instance'
import { get_instance_worlds, type SingleplayerWorld } from '@/helpers/worlds'

export type LocalAchievement = {
	id: string
	name: string
	date?: number
	world: string
	instanceId: string
}

export type LocalAchievements = {
	achievements: LocalAchievement[]
	worldCount: number
	isOffline: boolean
}

type Advancement = { done?: boolean; criteria?: Record<string, string> }

const advancementLocalizationCache = new Map<string, Promise<Record<string, string>>>()

export function loadAchievementLocalization(locale: string): Promise<Record<string, string>> {
	const minecraftLocale = locale.toLowerCase().replace('-', '_')
	let pending = advancementLocalizationCache.get(minecraftLocale)
	if (!pending) {
		let cachedTranslations: Record<string, string> = {}
		try {
			cachedTranslations = JSON.parse(
				localStorage.getItem(`fakedrinth-minecraft-language-${minecraftLocale}`) ?? '{}',
			) as Record<string, string>
		} catch {
			cachedTranslations = {}
		}
		pending = fetch(
			`https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/lang/${minecraftLocale}.json`,
		)
			.then((response) => {
				if (!response.ok) throw new Error(`Minecraft language file unavailable: ${response.status}`)
				return response.json() as Promise<Record<string, string>>
			})
			.then((translations) => {
				try {
					localStorage.setItem(
						`fakedrinth-minecraft-language-${minecraftLocale}`,
						JSON.stringify(translations),
					)
				} catch {
					return translations
				}
				return translations
			})
			.catch(() => {
				advancementLocalizationCache.delete(minecraftLocale)
				return cachedTranslations
			})
		advancementLocalizationCache.set(minecraftLocale, pending)
	}
	return pending
}

export function getLocalizedAdvancementText(
	id: string,
	field: 'title' | 'description',
	translations: Record<string, string>,
): string {
	const advancementId = id.replace(/^[^:]+:/, '')
	return translations[`advancements.${advancementId}.${field}`] ?? ''
}

export async function get_default_user_achievements(): Promise<LocalAchievements> {
	const userId = await get_default_user()
	const accountList = await users()
	const accounts = Array.isArray(accountList) ? accountList : []
	const account = accounts.find((entry) => entry.profile?.id === userId)
	if (!account?.offline || !userId) {
		return { achievements: [], worldCount: 0, isOffline: false }
	}

	const instances = await list()
	const worlds = (
		await Promise.all(
			instances.map(async (instance) => {
				const instanceWorlds = await get_instance_worlds(instance.id).catch(() => [])
				return instanceWorlds
					.filter((world): world is SingleplayerWorld => world.type === 'singleplayer')
					.map((world) => ({ instanceId: instance.id, world }))
			}),
		)
	).flat()

	const achievementsById = new Map<string, LocalAchievement>()
	await Promise.all(
		worlds.map(async ({ instanceId, world }) => {
			const path = `saves/${world.path}/advancements/${userId}.json`
			try {
				const bytes = await invoke<number[]>('plugin:files|file_read', { instanceId, path })
				const data = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes))) as Record<
					string,
					Advancement
				>
				for (const [id, advancement] of Object.entries(data)) {
					if (!advancement?.done || id.endsWith('/root')) continue
					const timestamps = Object.values(advancement.criteria ?? {})
						.map((timestamp) => Date.parse(timestamp))
						.filter(Number.isFinite)
					const date = timestamps.length ? Math.max(...timestamps) : undefined
					const existing = achievementsById.get(id)
					if (!existing || (date ?? 0) > (existing.date ?? 0)) {
						const name = id.split('/').pop()?.replaceAll('_', ' ') ?? id
						achievementsById.set(id, { id, name, date, world: world.name, instanceId })
					}
				}
			} catch {
				// A world without an advancement file has no achievements stored for this profile.
			}
		}),
	)

	const achievements = [...achievementsById.values()].sort(
		(a, b) => (b.date ?? 0) - (a.date ?? 0) || a.name.localeCompare(b.name),
	)
	return { achievements, worldCount: worlds.length, isOffline: true }
}

