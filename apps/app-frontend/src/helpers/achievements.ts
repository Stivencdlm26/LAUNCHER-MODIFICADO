import { invoke } from '@tauri-apps/api/core'

import { get_default_user, users } from '@/helpers/auth.js'
import { list } from '@/helpers/instance'
import { get_instance_worlds, type SingleplayerWorld } from '@/helpers/worlds'

export type LocalAchievement = {
	id: string
	name: string
	description: string
	date?: number
	world: string
	instanceId: string
	unlocked: boolean
}

export type LocalAchievements = {
	achievements: LocalAchievement[]
	worldCount: number
	isOffline: boolean
}

type Advancement = { done?: boolean; criteria?: Record<string, string> }

const vanillaAdvancementIds = `
story/cure_zombie_villager story/deflect_arrow story/enchant_item story/enter_the_end story/enter_the_nether story/follow_ender_eye story/form_obsidian story/iron_tools story/lava_bucket story/mine_diamond story/mine_stone story/obtain_armor story/shiny_gear story/smelt_iron story/upgrade_tools
nether/all_effects nether/all_potions nether/brew_potion nether/charge_respawn_anchor nether/create_beacon nether/create_full_beacon nether/distract_piglin nether/explore_nether nether/fast_travel nether/find_bastion nether/find_fortress nether/get_wither_skull nether/loot_bastion nether/netherite_armor nether/obtain_ancient_debris nether/obtain_blaze_rod nether/obtain_crying_obsidian nether/return_to_sender nether/ride_strider nether/ride_strider_in_overworld_lava nether/summon_wither nether/uneasy_alliance
end/dragon_breath end/dragon_egg end/elytra end/enter_end_gateway end/find_end_city end/kill_dragon end/levitate end/respawn_dragon
husbandry/allay_deliver_cake_to_note_block husbandry/allay_deliver_item_to_player husbandry/axolotl_in_a_bucket husbandry/balanced_diet husbandry/bred_all_animals husbandry/breed_an_animal husbandry/complete_catalogue husbandry/feed_snifflet husbandry/fishy_business husbandry/froglights husbandry/kill_axolotl_target husbandry/leash_all_frog_variants husbandry/make_a_sign_glow husbandry/obtain_netherite_hoe husbandry/obtain_sniffer_egg husbandry/place_dried_ghast_in_water husbandry/plant_any_sniffer_seed husbandry/plant_seed husbandry/remove_wolf_armor husbandry/repair_wolf_armor husbandry/ride_a_boat_with_a_goat husbandry/safely_harvest_honey husbandry/silk_touch_nest husbandry/tactical_fishing husbandry/tadpole_in_a_bucket husbandry/tame_an_animal husbandry/wax_off husbandry/wax_on husbandry/whole_pack
adventure/adventuring_time adventure/arbalistic adventure/avoid_vibration adventure/blowback adventure/brush_armadillo adventure/bullseye adventure/craft_decorated_pot_using_only_sherds adventure/crafters_crafting_crafters adventure/fall_from_world_height adventure/heart_transplanter adventure/hero_of_the_village adventure/honey_block_slide adventure/kill_a_mob adventure/kill_all_mobs adventure/kill_mob_near_sculk_catalyst adventure/lighten_up adventure/lightning_rod_with_villager_no_fire adventure/minecraft_trials_edition adventure/ol_betsy adventure/overoverkill adventure/play_jukebox_in_meadows adventure/read_power_of_chiseled_bookshelf adventure/revaulting adventure/salvage_sherd adventure/shoot_arrow adventure/sleep_in_bed adventure/sniper_duel adventure/spear_many_mobs adventure/spyglass_at_dragon adventure/spyglass_at_ghast adventure/spyglass_at_parrot adventure/summon_iron_golem adventure/throw_trident adventure/totem_of_undying adventure/trade adventure/trade_at_world_height adventure/trim_with_all_exclusive_armor_patterns adventure/trim_with_any_armor_pattern adventure/two_birds_one_arrow adventure/under_lock_and_key adventure/use_lodestone adventure/very_very_frightening adventure/voluntary_exile adventure/walk_on_powder_snow_with_leather_boots adventure/who_needs_rockets adventure/whos_the_pillager_now
`
	.trim()
	.split(/\s+/)
	.map((path) => `minecraft:${path}`)

const advancementIconItems: Record<string, string> = {
	'story/cure_zombie_villager': 'golden_apple',
	'story/deflect_arrow': 'shield',
	'story/enchant_item': 'enchanted_book',
	'story/enter_the_end': 'end_stone',
	'story/enter_the_nether': 'flint_and_steel',
	'story/follow_ender_eye': 'ender_eye',
	'story/form_obsidian': 'obsidian',
	'story/iron_tools': 'iron_pickaxe',
	'story/lava_bucket': 'lava_bucket',
	'story/mine_diamond': 'diamond',
	'story/mine_stone': 'wooden_pickaxe',
	'story/obtain_armor': 'iron_chestplate',
	'story/shiny_gear': 'diamond_chestplate',
	'story/smelt_iron': 'iron_ingot',
	'story/upgrade_tools': 'stone_pickaxe',
	'nether/all_effects': 'bucket',
	'nether/all_potions': 'milk_bucket',
	'nether/brew_potion': 'potion',
	'nether/charge_respawn_anchor': 'respawn_anchor',
	'nether/create_beacon': 'beacon',
	'nether/create_full_beacon': 'beacon',
	'nether/distract_piglin': 'gold_ingot',
	'nether/explore_nether': 'netherite_boots',
	'nether/fast_travel': 'map',
	'nether/find_bastion': 'polished_blackstone_bricks',
	'nether/find_fortress': 'nether_bricks',
	'nether/get_wither_skull': 'wither_skeleton_skull',
	'nether/loot_bastion': 'chest',
	'nether/netherite_armor': 'netherite_chestplate',
	'nether/obtain_ancient_debris': 'ancient_debris',
	'nether/obtain_blaze_rod': 'blaze_rod',
	'nether/obtain_crying_obsidian': 'crying_obsidian',
	'nether/return_to_sender': 'fire_charge',
	'nether/ride_strider': 'warped_fungus_on_a_stick',
	'nether/ride_strider_in_overworld_lava': 'warped_fungus_on_a_stick',
	'nether/summon_wither': 'nether_star',
	'nether/uneasy_alliance': 'ghast_tear',
	'end/dragon_breath': 'dragon_breath',
	'end/dragon_egg': 'dragon_egg',
	'end/elytra': 'elytra',
	'end/enter_end_gateway': 'ender_pearl',
	'end/find_end_city': 'purpur_block',
	'end/kill_dragon': 'dragon_head',
	'end/levitate': 'shulker_shell',
	'end/respawn_dragon': 'end_crystal',
	'husbandry/allay_deliver_cake_to_note_block': 'note_block',
	'husbandry/allay_deliver_item_to_player': 'amethyst_shard',
	'husbandry/axolotl_in_a_bucket': 'axolotl_bucket',
	'husbandry/balanced_diet': 'golden_carrot',
	'husbandry/bred_all_animals': 'golden_carrot',
	'husbandry/breed_an_animal': 'wheat',
	'husbandry/complete_catalogue': 'cod',
	'husbandry/feed_snifflet': 'torchflower_seeds',
	'husbandry/fishy_business': 'fishing_rod',
	'husbandry/froglights': 'ochre_froglight',
	'husbandry/kill_axolotl_target': 'tropical_fish_bucket',
	'husbandry/leash_all_frog_variants': 'lead',
	'husbandry/make_a_sign_glow': 'glow_ink_sac',
	'husbandry/obtain_netherite_hoe': 'netherite_hoe',
	'husbandry/obtain_sniffer_egg': 'sniffer_egg',
	'husbandry/place_dried_ghast_in_water': 'dried_ghast',
	'husbandry/plant_any_sniffer_seed': 'pitcher_pod',
	'husbandry/plant_seed': 'wheat_seeds',
	'husbandry/remove_wolf_armor': 'shears',
	'husbandry/repair_wolf_armor': 'armadillo_scute',
	'husbandry/ride_a_boat_with_a_goat': 'oak_boat',
	'husbandry/safely_harvest_honey': 'honey_bottle',
	'husbandry/silk_touch_nest': 'bee_nest',
	'husbandry/tactical_fishing': 'pufferfish_bucket',
	'husbandry/tadpole_in_a_bucket': 'tadpole_bucket',
	'husbandry/tame_an_animal': 'bone',
	'husbandry/wax_off': 'stone_axe',
	'husbandry/wax_on': 'honeycomb',
	'husbandry/whole_pack': 'wolf_spawn_egg',
	'adventure/adventuring_time': 'diamond_boots',
	'adventure/arbalistic': 'crossbow',
	'adventure/avoid_vibration': 'sculk_sensor',
	'adventure/blowback': 'wind_charge',
	'adventure/brush_armadillo': 'brush',
	'adventure/bullseye': 'target',
	'adventure/craft_decorated_pot_using_only_sherds': 'decorated_pot',
	'adventure/crafters_crafting_crafters': 'crafter',
	'adventure/fall_from_world_height': 'water_bucket',
	'adventure/heart_transplanter': 'heart_of_the_sea',
	'adventure/hero_of_the_village': 'emerald',
	'adventure/honey_block_slide': 'honey_block',
	'adventure/kill_a_mob': 'iron_sword',
	'adventure/kill_all_mobs': 'nether_star',
	'adventure/kill_mob_near_sculk_catalyst': 'sculk_catalyst',
	'adventure/lighten_up': 'copper_bulb',
	'adventure/lightning_rod_with_villager_no_fire': 'lightning_rod',
	'adventure/minecraft_trials_edition': 'trial_key',
	'adventure/ol_betsy': 'crossbow',
	'adventure/overoverkill': 'mace',
	'adventure/play_jukebox_in_meadows': 'jukebox',
	'adventure/read_power_of_chiseled_bookshelf': 'chiseled_bookshelf',
	'adventure/revaulting': 'vault',
	'adventure/salvage_sherd': 'brush',
	'adventure/shoot_arrow': 'bow',
	'adventure/sleep_in_bed': 'red_bed',
	'adventure/sniper_duel': 'arrow',
	'adventure/spear_many_mobs': 'diamond_spear',
	'adventure/spyglass_at_dragon': 'spyglass',
	'adventure/spyglass_at_ghast': 'spyglass',
	'adventure/spyglass_at_parrot': 'spyglass',
	'adventure/summon_iron_golem': 'carved_pumpkin',
	'adventure/throw_trident': 'trident',
	'adventure/totem_of_undying': 'totem_of_undying',
	'adventure/trade': 'emerald',
	'adventure/trade_at_world_height': 'emerald',
	'adventure/trim_with_all_exclusive_armor_patterns': 'silence_armor_trim_smithing_template',
	'adventure/trim_with_any_armor_pattern': 'dune_armor_trim_smithing_template',
	'adventure/two_birds_one_arrow': 'crossbow',
	'adventure/under_lock_and_key': 'trial_key',
	'adventure/use_lodestone': 'compass',
	'adventure/very_very_frightening': 'trident',
	'adventure/voluntary_exile': 'ominous_banner',
	'adventure/walk_on_powder_snow_with_leather_boots': 'leather_boots',
	'adventure/who_needs_rockets': 'elytra',
	'adventure/whos_the_pillager_now': 'crossbow',
}

export function getAchievementIconUrl(id: string): string {
	const key = advancementKey(id)
	const item = advancementIconItems[key]
	return item
		? `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/textures/item/${item}.png`
		: ''
}

const advancementTitles = new Map<string, string>([
	['story/mine_stone', 'Edad de piedra'],
	['story/upgrade_tools', 'Mejorando'],
	['story/smelt_iron', 'Adquiriendo hardware'],
	['story/obtain_armor', 'Ponte la armadura'],
	['story/lava_bucket', '¡Esto sí que quema!'],
	['story/iron_tools', '¿Esto es hierro?'],
	['story/deflect_arrow', 'Hoy no, gracias'],
	['story/form_obsidian', 'Desafío de hielo'],
	['story/mine_diamond', '¡Diamantes!'],
	['story/enter_the_nether', 'Tenemos que ir más profundo'],
	['story/shiny_gear', 'Cúbrete de diamantes'],
	['story/enchant_item', 'Encantador'],
	['story/cure_zombie_villager', 'Doctor zombi'],
	['story/follow_ender_eye', '¿Ojo espía?'],
	['story/enter_the_end', '¿El fin?'],
	['nether/return_to_sender', 'Devolución al remitente'],
	['nether/find_bastion', 'Restos del bastión'],
	['nether/obtain_ancient_debris', 'Restos escondidos'],
	['nether/netherite_armor', 'Cúbrete de netherita'],
	['nether/get_wither_skull', 'Esqueletos tenebrosos'],
	['nether/summon_wither', 'Invoca a Wither'],
	['nether/brew_potion', 'Cóctel furioso'],
	['nether/create_beacon', 'Faro local'],
	['nether/all_potions', 'Cóctel furioso'],
	['nether/create_full_beacon', 'Cómo hemos llegado aquí'],
	['nether/explore_nether', 'Destino turístico caliente'],
	['nether/fast_travel', 'Subespacio burbujeante'],
	['nether/uneasy_alliance', 'Alianza incómoda'],
	['nether/ride_strider', 'Flota como una pluma'],
	['nether/charge_respawn_anchor', '¿Quién corta las cebollas?'],
	['nether/find_fortress', 'Una terrible fortaleza'],
	['end/kill_dragon', 'Liberar el End'],
	['end/dragon_egg', 'La siguiente generación'],
	['end/enter_end_gateway', 'Una vista increíble desde aquí arriba'],
	['end/respawn_dragon', 'El fin... otra vez...'],
	['end/dragon_breath', 'Necesitas una menta'],
	['end/find_end_city', 'La ciudad al final del juego'],
	['end/elytra', 'Cielos limpios'],
	['end/levitate', 'Hasta aquí y más allá'],
	['adventure/kill_a_mob', 'Cazamonstruos'],
	['adventure/trade', '¿Qué trato?'],
	['adventure/sleep_in_bed', 'Dulces sueños'],
	['adventure/hero_of_the_village', 'Héroe de la aldea'],
	['adventure/voluntary_exile', 'Exilio voluntario'],
	['adventure/kill_mob_near_sculk_catalyst', 'Monstruo cazado'],
	['adventure/avoid_vibration', 'El sigilo es oro'],
	['adventure/walk_on_powder_snow_with_leather_boots', 'Ligero como un conejo'],
	['adventure/play_jukebox_in_meadows', 'Sonidos de música'],
	['adventure/ol_betsy', 'La vieja Betsy'],
	['adventure/sniper_duel', 'Duelo de francotiradores'],
	['adventure/bullseye', 'En el blanco'],
	['adventure/two_birds_one_arrow', 'Dos pájaros de un tiro'],
	['adventure/arbalistic', 'Arbalística'],
	['adventure/whos_the_pillager_now', '¿Quién es el saqueador ahora?'],
	['husbandry/breed_an_animal', 'Los loros y los murciélagos'],
	['husbandry/tame_an_animal', 'Mejores amigos para siempre'],
	['husbandry/fishy_business', 'Negocio sospechoso'],
	['husbandry/tactical_fishing', 'Pesca táctica'],
	['husbandry/a_seedy_place', 'Un lugar con semillas'],
	['husbandry/balanced_diet', 'Dieta equilibrada'],
	['husbandry/complete_catalogue', 'Catálogo completo'],
	['husbandry/two_by_two', 'De dos en dos'],
	['husbandry/plant_anything', '¡A cultivar!'],
	['husbandry/axolotl_in_a_bucket', 'El depredador más adorable'],
	['husbandry/kill_axolotl_target', 'Amistad y lealtad'],
	['husbandry/froglights', 'Con nuestras fuerzas combinadas'],
	['husbandry/allay_deliver_item_to_player', '¡Brilla y deslumbra!'],
])

const englishAdvancementTitles = new Map<string, string>([
	['story/mine_stone', 'Stone Age'],
	['story/upgrade_tools', 'Getting an Upgrade'],
	['story/smelt_iron', 'Acquire Hardware'],
	['story/obtain_armor', 'Suit Up'],
	['story/lava_bucket', 'Hot Stuff'],
	['story/iron_tools', 'Isn’t It Iron Pick'],
	['story/deflect_arrow', 'Not Today, Thank You'],
	['story/form_obsidian', 'Ice Bucket Challenge'],
	['story/mine_diamond', 'Diamonds!'],
	['story/enter_the_nether', 'We Need to Go Deeper'],
	['story/shiny_gear', 'Cover Me with Diamonds'],
	['story/enchant_item', 'Enchanter'],
	['story/cure_zombie_villager', 'Zombie Doctor'],
	['story/follow_ender_eye', 'Eye Spy'],
	['story/enter_the_end', 'The End?'],
	['nether/return_to_sender', 'Return to Sender'],
	['nether/find_bastion', 'Those Were the Days'],
	['nether/obtain_ancient_debris', 'Hidden in the Depths'],
	['nether/netherite_armor', 'Cover Me in Debris'],
	['nether/summon_wither', 'Withering Heights'],
	['nether/create_beacon', 'Bring Home the Beacon'],
	['nether/create_full_beacon', 'Beaconator'],
	['end/kill_dragon', 'Free the End'],
	['end/dragon_egg', 'The Next Generation'],
	['end/elytra', 'Sky’s the Limit'],
	['adventure/kill_a_mob', 'Monster Hunter'],
	['adventure/trade', 'What a Deal!'],
	['adventure/sleep_in_bed', 'Sweet Dreams'],
	['adventure/hero_of_the_village', 'Hero of the Village'],
	['husbandry/breed_an_animal', 'The Parrots and the Bats'],
	['husbandry/tame_an_animal', 'Best Friends Forever'],
	['husbandry/fishy_business', 'A Fishy Business'],
	['husbandry/balanced_diet', 'A Balanced Diet'],
])

const advancementDescriptions = new Map<string, [string, string]>([
	['story/mine_stone', ['Consigue piedra picando roca con un pico.', 'Mine stone with a pickaxe.']],
	['story/upgrade_tools', ['Fabrica un pico de mejor calidad.', 'Construct a better pickaxe.']],
	['story/smelt_iron', ['Funde hierro para obtener un lingote.', 'Smelt an iron ingot.']],
	[
		'story/obtain_armor',
		['Ponte una pieza de armadura de hierro.', 'Put on a piece of iron armor.'],
	],
	['story/lava_bucket', ['Llena un cubo con lava.', 'Fill a bucket with lava.']],
	['story/iron_tools', ['Fabrica un pico de hierro.', 'Upgrade your pickaxe.']],
	[
		'story/deflect_arrow',
		['Bloquea un proyectil con un escudo.', 'Deflect a projectile with a shield.'],
	],
	['story/form_obsidian', ['Consigue obsidiana.', 'Obtain a block of obsidian.']],
	['story/mine_diamond', ['Consigue diamantes.', 'Acquire diamonds.']],
	['story/enter_the_nether', ['Entra en el Nether.', 'Enter the Nether.']],
	[
		'story/shiny_gear',
		['Consigue una pieza de armadura de diamante.', 'Obtain a piece of diamond armor.'],
	],
	[
		'story/enchant_item',
		['Encanta un objeto en una mesa de encantamientos.', 'Enchant an item at an enchanting table.'],
	],
	['story/cure_zombie_villager', ['Cura a un aldeano zombi.', 'Cure a zombie villager.']],
	[
		'story/follow_ender_eye',
		['Sigue un ojo de ender hasta una fortaleza.', 'Follow an Eye of Ender to a stronghold.'],
	],
	['story/enter_the_end', ['Entra en la dimensión del End.', 'Enter the End dimension.']],
	[
		'nether/return_to_sender',
		['Destruye un ghast con una bola de fuego.', 'Destroy a Ghast with a fireball.'],
	],
	['nether/find_bastion', ['Entra en un bastión del Nether.', 'Enter a Bastion Remnant.']],
	['nether/obtain_ancient_debris', ['Funde escombros ancestrales.', 'Smelt Ancient Debris.']],
	[
		'nether/netherite_armor',
		['Consigue una armadura de netherita.', 'Obtain a full set of Netherite armor.'],
	],
	['nether/summon_wither', ['Invoca al Wither.', 'Summon the Wither.']],
	['nether/create_beacon', ['Construye y activa una baliza.', 'Construct and activate a Beacon.']],
	[
		'nether/create_full_beacon',
		['Construye una baliza con una pirámide completa.', 'Create a Beacon with a full pyramid.'],
	],
	['end/kill_dragon', ['Derrota al dragón del End.', 'Defeat the Ender Dragon.']],
	['end/dragon_egg', ['Consigue el huevo de dragón.', 'Obtain the Dragon Egg.']],
	['end/elytra', ['Consigue unas élitras.', 'Find Elytra.']],
	['adventure/kill_a_mob', ['Mata a cualquier criatura hostil.', 'Kill any hostile monster.']],
	['adventure/trade', ['Intercambia con un aldeano.', 'Successfully trade with a Villager.']],
	[
		'adventure/sleep_in_bed',
		[
			'Duerme en una cama para cambiar el punto de reaparición.',
			'Sleep in a Bed to change your respawn point.',
		],
	],
	[
		'adventure/hero_of_the_village',
		['Defiende una aldea de una incursión.', 'Successfully defend a village from a raid.'],
	],
	['husbandry/breed_an_animal', ['Cría una pareja de animales.', 'Breed a pair of animals.']],
	['husbandry/tame_an_animal', ['Domestica un animal.', 'Tame an animal.']],
	['husbandry/fishy_business', ['Pesca un pez.', 'Catch a fish.']],
	[
		'husbandry/balanced_diet',
		['Come todos los alimentos que aportan progreso al logro.', 'Eat everything that is edible.'],
	],
])

function advancementKey(id: string): string {
	return id.replace(/^[^:]+:/, '')
}

export function getAchievementName(id: string, locale = 'en-US'): string {
	const key = advancementKey(id)
	const knownTitle = locale.toLowerCase().startsWith('es')
		? advancementTitles.get(key)
		: englishAdvancementTitles.get(key)
	if (knownTitle) return knownTitle
	const lastSegment = key.split('/').pop() ?? key
	return lastSegment
		.replaceAll('_', ' ')
		.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

export function getAchievementDescription(id: string, locale = 'en-US'): string {
	const descriptions = advancementDescriptions.get(advancementKey(id))
	if (descriptions) return descriptions[locale.toLowerCase().startsWith('es') ? 0 : 1]
	const name = getAchievementName(id, locale)
	return locale.toLowerCase().startsWith('es')
		? `Desbloquea «${name}» completando su desafío en Minecraft.`
		: `Unlock “${name}” by completing its challenge in Minecraft.`
}

function createLockedVanillaAchievements(): Map<string, LocalAchievement> {
	return new Map(
		vanillaAdvancementIds.map((id) => {
			const name = getAchievementName(id)
			return [
				id,
				{
					id,
					name,
					description: getAchievementDescription(id),
					world: '',
					instanceId: '',
					unlocked: false,
				},
			]
		}),
	)
}

export async function get_default_user_achievements(
	instanceIds?: Iterable<string>,
): Promise<LocalAchievements> {
	const userId = await get_default_user()
	const accountList = await users()
	const accounts = Array.isArray(accountList) ? accountList : []
	const account = accounts.find((entry) => entry.profile?.id === userId)
	if (!account || !userId) {
		return {
			achievements: [...createLockedVanillaAchievements().values()],
			worldCount: 0,
			isOffline: false,
		}
	}

	const selectedInstanceIds = instanceIds === undefined ? null : new Set(instanceIds)
	const instances = (await list()).filter(
		(instance) => selectedInstanceIds === null || selectedInstanceIds.has(instance.id),
	)
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

	const achievementsById = createLockedVanillaAchievements()
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
					if (
						!advancement ||
						typeof advancement !== 'object' ||
						!id.includes(':') ||
						id.endsWith('/root') ||
						/(?:^|:)recipes\//.test(id)
					)
						continue
					const timestamps = Object.values(advancement.criteria ?? {})
						.map((timestamp) => Date.parse(timestamp))
						.filter(Number.isFinite)
					const date = timestamps.length ? Math.max(...timestamps) : undefined
					const unlocked = Boolean(advancement.done)
					const existing = achievementsById.get(id)
					if (
						!existing ||
						(unlocked && !existing.unlocked) ||
						(unlocked === existing.unlocked && (date ?? 0) > (existing.date ?? 0))
					) {
						const name = getAchievementName(id)
						const description = getAchievementDescription(id)
						achievementsById.set(id, {
							id,
							name,
							description,
							date,
							world: world.name,
							instanceId,
							unlocked,
						})
					}
				}
			} catch {
				// A world without an advancement file has no achievements stored for this profile.
			}
		}),
	)

	const achievements = [...achievementsById.values()].sort(
		(a, b) =>
			Number(b.unlocked) - Number(a.unlocked) ||
			(b.date ?? 0) - (a.date ?? 0) ||
			a.name.localeCompare(b.name),
	)
	return { achievements, worldCount: worlds.length, isOffline: Boolean(account.offline) }
}
