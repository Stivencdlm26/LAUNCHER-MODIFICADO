<script setup lang="ts">
import { LockIcon } from '@modrinth/assets'
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import beaconIcon from '@/assets/instance-icons/beacon.png'
import craftingTableIcon from '@/assets/instance-icons/crafting-table.png'
import enderDragonIcon from '@/assets/instance-icons/ender-dragon.png'
import pickaxeIcon from '@/assets/instance-icons/pickaxe.png'
import swordIcon from '@/assets/instance-icons/sword.png'
import {
	get_default_user_achievements,
	getAchievementDescription,
	getAchievementIconUrl,
	getAchievementName,
	type LocalAchievement,
} from '@/helpers/achievements'
import i18n from '@/i18n.config'

const achievementsQuery = useQuery({
	queryKey: ['minecraft-achievements', 'sidebar'],
	queryFn: get_default_user_achievements,
	staleTime: 30_000,
})
const achievements = computed(() => achievementsQuery.data.value?.achievements ?? [])
const selectedAchievement = ref<LocalAchievement | null>(null)
const locale = computed(() => i18n.global.locale.value)
const lockedLabel = computed(() =>
	locale.value.toLowerCase().startsWith('es') ? 'Bloqueado' : 'Locked',
)
const notYetEarnedLabel = computed(() =>
	locale.value.toLowerCase().startsWith('es') ? 'Aún no conseguido' : 'Not earned yet',
)
const unlockedAchievements = computed(() =>
	achievements.value.filter((achievement) => achievement.unlocked),
)
const lockedAchievements = computed(() =>
	achievements.value.filter((achievement) => !achievement.unlocked),
)
const latestAchievement = computed(() => unlockedAchievements.value[0])
const achievementsError = computed(() => {
	const error = achievementsQuery.error.value
	return error instanceof Error ? error.message : error ? String(error) : ''
})
function achievementIcon(id: string): string {
	const minecraftIcon = getAchievementIconUrl(id)
	if (minecraftIcon) return minecraftIcon
	return localAchievementIcon(id)
}
function localAchievementIcon(id: string): string {
	const key = id.toLowerCase()
	if (/(craft|planks|table|recipe|inventory)/.test(key)) return craftingTableIcon
	if (/(mine|stone|ore|iron|diamond|pickaxe|deepslate)/.test(key)) return pickaxeIcon
	if (/(dragon|elytra|end_city|end\/|shulker)/.test(key)) return enderDragonIcon
	if (/(nether|beacon|wither|blaze)/.test(key)) return beaconIcon
	if (/(combat|sword|monster|kill|raid|skeleton|zombie)/.test(key)) return swordIcon
	return craftingTableIcon
}
function fallbackAchievementIcon(event: Event, id: string): void {
	const image = event.currentTarget
	if (!(image instanceof HTMLImageElement)) return
	image.onerror = null
	image.src = localAchievementIcon(id)
}
function achievementName(id: string): string {
	return getAchievementName(id, locale.value)
}
function achievementDescription(id: string): string {
	return getAchievementDescription(id, locale.value)
}
</script>

<template>
	<main class="achievements-page">
		<header class="achievements-header">
			<div class="achievements-icon"><img :src="craftingTableIcon" alt="" /></div>
			<div>
				<p>PROGRESOS LOCALES · JAVA EDITION</p>
				<h1>Progresos de Minecraft Java</h1>
				<span
					>Se revisan tus mundos guardados al abrir el launcher. No necesitas iniciar una
					instancia.</span
				>
			</div>
		</header>
		<div class="achievement-stage" aria-hidden="true">
			<div class="achievement-stage-caption">
				<img :src="craftingTableIcon" alt="" />
				<span
					>Progresos oficiales de Java<small>Conseguidos y pendientes en tus mundos</small></span
				>
			</div>
			<div class="achievement-scene-art">
				<span class="scene-star star-a"></span><span class="scene-star star-b"></span>
				<span class="scene-star star-c"></span><span class="scene-star star-d"></span>
				<img class="scene-item" :src="enderDragonIcon" alt="" />
			</div>
		</div>

		<div v-if="achievementsQuery.isLoading.value" class="achievements-state">
			Buscando logros en tus mundos…
		</div>
		<div v-else-if="achievementsQuery.isError.value" class="achievements-state">
			<strong>No se pudieron leer los logros locales.</strong>
			<span>{{ achievementsError }}</span>
			<button type="button" class="retry-button" @click="achievementsQuery.refetch()">
				Reintentar
			</button>
		</div>
		<template v-else>
			<div class="achievements-summary">
				<strong>{{ unlockedAchievements.length }}</strong
				><span>obtenidos</span> <strong>{{ lockedAchievements.length }}</strong
				><span>bloqueados</span> <strong>{{ achievementsQuery.data.value?.worldCount ?? 0 }}</strong
				><span>mundos revisados</span>
			</div>
			<article v-if="latestAchievement" class="latest-achievement-card">
				<div class="latest-achievement-emblem">
					<img
						:src="achievementIcon(latestAchievement.id)"
						alt=""
						@error="fallbackAchievementIcon($event, latestAchievement.id)"
					/>
				</div>
				<div>
					<small>ÚLTIMO LOGRO CONSEGUIDO</small>
					<strong>{{ achievementName(latestAchievement.id) }}</strong>
					<span>{{ latestAchievement.world }}</span>
				</div>
				<time
					v-if="latestAchievement.date"
					:datetime="new Date(latestAchievement.date).toISOString()"
				>
					{{ new Date(latestAchievement.date).toLocaleDateString() }}
				</time>
			</article>
			<div v-if="achievements.length" class="achievements-grid">
				<article
					v-for="achievement in achievements"
					:key="achievement.id"
					class="achievement-card"
					:class="{ 'achievement-card-locked': !achievement.unlocked }"
				>
					<img
						class="achievement-card-icon"
						:src="achievementIcon(achievement.id)"
						alt=""
						@error="fallbackAchievementIcon($event, achievement.id)"
					/>
					<div>
						<strong>{{ achievementName(achievement.id) }}</strong
						><small>{{ achievement.world || lockedLabel }}</small>
						<button
							type="button"
							class="achievement-reference"
							:aria-label="`Ver nombre y descripción: ${achievementName(achievement.id)}`"
							@click="selectedAchievement = achievement"
						>
							<img
								:src="achievementIcon(achievement.id)"
								alt=""
								@error="fallbackAchievementIcon($event, achievement.id)"
							/>
							<span>Ver logro y descripción</span>
						</button>
					</div>
					<span v-if="!achievement.unlocked" class="achievement-locked-label">
						<LockIcon /> {{ lockedLabel }}
					</span>
					<time v-else-if="achievement.date" :datetime="new Date(achievement.date).toISOString()">
						{{ new Date(achievement.date).toLocaleDateString() }}
					</time>
				</article>
			</div>
			<div v-else class="achievements-state">
				<strong>Aún no hay logros registrados</strong>
				<span
					>El launcher ya revisó todos los mundos guardados de esta cuenta y todavía no encontró
					avances.</span
				>
			</div>
		</template>
		<div
			v-if="selectedAchievement"
			class="achievement-dialog-backdrop"
			@click.self="selectedAchievement = null"
			@keydown.esc="selectedAchievement = null"
		>
			<section class="achievement-dialog" role="dialog" aria-modal="true">
				<button
					type="button"
					class="achievement-dialog-close"
					aria-label="Cerrar detalle del logro"
					@click="selectedAchievement = null"
				>
					×
				</button>
				<img
					:src="achievementIcon(selectedAchievement.id)"
					alt=""
					@error="fallbackAchievementIcon($event, selectedAchievement.id)"
				/>
				<p>LOGRO DE MINECRAFT</p>
				<h2>{{ achievementName(selectedAchievement.id) }}</h2>
				<span>{{ achievementDescription(selectedAchievement.id) }}</span>
				<small>{{ selectedAchievement.world || notYetEarnedLabel }}</small>
			</section>
		</div>
	</main>
</template>

<style scoped>
.achievements-page {
	max-width: 68rem;
	margin: 0 auto;
	padding: 2rem;
	color: var(--fakedrinth-text, var(--color-contrast));
}
.achievements-header {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
}
.achievements-icon {
	display: grid;
	width: 3.5rem;
	height: 3.5rem;
	place-items: center;
	border: 1px solid color-mix(in srgb, var(--fakedrinth-accent, #ff5361) 50%, transparent);
	border-radius: 1rem;
	background: color-mix(in srgb, var(--fakedrinth-buttons, #d61f32) 20%, transparent);
	color: var(--fakedrinth-accent, #ff5361);
}
.achievements-icon :deep(svg) {
	width: 1.75rem;
	height: 1.75rem;
}
.achievements-icon img {
	width: 2.3rem;
	height: 2.3rem;
}
.achievements-header p {
	margin: 0 0 0.3rem;
	color: var(--fakedrinth-accent, #ff5361);
	font-size: 0.7rem;
	font-weight: 800;
	letter-spacing: 0.12em;
}
.achievements-header h1 {
	margin: 0;
	font-size: 1.7rem;
}
.achievements-header span,
.achievement-card small,
.achievements-state span {
	color: var(--color-secondary);
}
.achievement-stage {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 7.5rem;
	margin: -0.5rem 0 1.35rem;
	overflow: hidden;
	border: 1px solid color-mix(in srgb, var(--fakedrinth-accent, #ff5361) 25%, transparent);
	border-radius: 1rem;
	background:
		radial-gradient(
			ellipse at 86% 52%,
			color-mix(in srgb, var(--fakedrinth-buttons, #d61f32) 30%, transparent),
			transparent 44%
		),
		linear-gradient(100deg, var(--surface-2), var(--surface-1));
}
.achievement-stage-caption {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	height: 100%;
	padding: 0 1.5rem;
}
.achievement-stage-caption img {
	width: 2.75rem;
	height: 2.75rem;
}
.achievement-stage-caption span {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	font-weight: 700;
}
.achievement-stage-caption small {
	color: var(--color-secondary);
	font-size: 0.75rem;
	font-weight: 400;
}
.achievement-scene-art {
	position: relative;
	width: 12rem;
	height: 100%;
	margin-right: 3rem;
}
.scene-item {
	position: absolute;
	right: 2.5rem;
	bottom: 0.45rem;
	width: 5.5rem;
	height: 5.5rem;
	object-fit: contain;
	image-rendering: pixelated;
	filter: drop-shadow(
		0 0 1.2rem color-mix(in srgb, var(--fakedrinth-accent, #ff5361) 55%, transparent)
	);
}
.scene-star {
	position: absolute;
	width: 0.35rem;
	height: 0.35rem;
	background: #ffe3a8;
	box-shadow: 0 0 0.7rem #ffcc65;
	animation: scene-sparkle 1.5s ease-in-out infinite alternate;
}
.star-a {
	top: 1.1rem;
	right: 1.5rem;
}
.star-b {
	top: 2.2rem;
	right: 7.5rem;
	animation-delay: 0.3s;
}
.star-c {
	top: 3.8rem;
	right: 0.8rem;
	animation-delay: 0.6s;
}
.star-d {
	top: 0.8rem;
	right: 5rem;
	animation-delay: 0.9s;
}
.achievements-summary {
	display: flex;
	align-items: baseline;
	gap: 0.55rem;
	margin-bottom: 1.25rem;
	padding: 1rem 1.2rem;
	border: 1px solid var(--surface-4);
	border-radius: 0.85rem;
	background: var(--surface-2);
}
.achievements-summary strong {
	color: var(--fakedrinth-accent, #ff5361);
	font-size: 1.35rem;
}
.achievements-summary span {
	margin-right: 1rem;
	color: var(--color-secondary);
}
.latest-achievement-card {
	display: flex;
	align-items: center;
	gap: 0.9rem;
	margin-bottom: 1rem;
	padding: 1rem;
	border: 1px solid color-mix(in srgb, var(--fakedrinth-accent, #ff5361) 38%, transparent);
	border-radius: 0.9rem;
	background: linear-gradient(
		110deg,
		color-mix(in srgb, var(--fakedrinth-buttons, #d61f32) 18%, var(--surface-2)),
		var(--surface-2)
	);
}
.latest-achievement-emblem {
	display: grid;
	flex: none;
	width: 2.8rem;
	height: 2.8rem;
	place-items: center;
	border: 1px solid color-mix(in srgb, var(--fakedrinth-accent, #ff5361) 45%, transparent);
	border-radius: 0.8rem;
	background: color-mix(in srgb, var(--fakedrinth-buttons, #d61f32) 24%, transparent);
	color: var(--fakedrinth-accent, #ff5361);
}
.latest-achievement-emblem :deep(svg) {
	width: 1.5rem;
	height: 1.5rem;
}
.latest-achievement-emblem img {
	width: 2.35rem;
	height: 2.35rem;
}
.latest-achievement-card div:nth-child(2) {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.2rem;
	min-width: 0;
}
.latest-achievement-card small {
	color: var(--fakedrinth-accent, #ff5361);
	font-size: 0.65rem;
	font-weight: 800;
	letter-spacing: 0.1em;
}
.latest-achievement-card strong {
	overflow: hidden;
	font-size: 1rem;
	text-overflow: ellipsis;
	text-transform: capitalize;
	white-space: nowrap;
}
.latest-achievement-card span,
.latest-achievement-card time {
	color: var(--color-secondary);
	font-size: 0.78rem;
}
.latest-achievement-card time {
	flex: none;
}
.achievements-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
	gap: 0.75rem;
}
.achievement-card {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-width: 0;
	padding: 0.9rem;
	border: 1px solid var(--surface-4);
	border-radius: 0.8rem;
	background: var(--surface-2);
}
.achievement-card-icon {
	width: 2rem;
	height: 2rem;
	flex: none;
}
.achievement-card div {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.25rem;
	min-width: 0;
}
.achievement-card strong {
	overflow: hidden;
	text-overflow: ellipsis;
	text-transform: capitalize;
	white-space: nowrap;
}
.achievement-card small {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.achievement-reference {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	width: fit-content;
	margin-top: 0.2rem;
	padding: 0.2rem 0.4rem;
	border: 1px solid var(--surface-4);
	border-radius: 0.4rem;
	background: var(--surface-1);
	color: var(--fakedrinth-accent, #ff5361);
	font: inherit;
	font-size: 0.68rem;
	cursor: pointer;
}
.achievement-reference img {
	width: 1.65rem;
	height: 1.65rem;
	image-rendering: pixelated;
}
.achievement-reference:hover {
	border-color: var(--fakedrinth-accent, #ff5361);
}
.achievement-dialog-backdrop {
	position: fixed;
	inset: 0;
	z-index: 1000;
	display: grid;
	place-items: center;
	padding: 1rem;
	background: rgb(0 0 0 / 68%);
}
.achievement-dialog {
	position: relative;
	display: flex;
	width: min(28rem, 100%);
	flex-direction: column;
	align-items: center;
	gap: 0.7rem;
	padding: 2rem;
	border: 1px solid color-mix(in srgb, var(--fakedrinth-accent, #ff5361) 50%, transparent);
	border-radius: 1rem;
	background: var(--surface-2);
	box-shadow: 0 1rem 4rem rgb(0 0 0 / 45%);
	text-align: center;
}
.achievement-dialog > img {
	width: 5rem;
	height: 5rem;
	image-rendering: pixelated;
}
.achievement-dialog p {
	margin: 0.5rem 0 0;
	color: var(--fakedrinth-accent, #ff5361);
	font-size: 0.7rem;
	font-weight: 800;
	letter-spacing: 0.12em;
}
.achievement-dialog h2 {
	margin: 0;
}
.achievement-dialog > span,
.achievement-dialog > small {
	color: var(--color-secondary);
}
.achievement-dialog-close {
	position: absolute;
	top: 0.6rem;
	right: 0.7rem;
	border: 0;
	background: transparent;
	color: var(--color-secondary);
	font-size: 1.6rem;
	cursor: pointer;
}
.achievement-card time {
	flex: none;
	color: var(--color-secondary);
	font-size: 0.75rem;
}
.achievement-card-locked {
	opacity: 0.58;
	filter: grayscale(0.7);
}
.achievement-card-locked .achievement-card-icon {
	filter: grayscale(1) brightness(0.7);
}
.achievement-locked-label {
	display: inline-flex;
	flex: none;
	align-items: center;
	gap: 0.3rem;
	color: var(--color-secondary);
	font-size: 0.72rem;
}
.achievement-locked-label :deep(svg) {
	width: 0.9rem;
	height: 0.9rem;
}
.achievements-state {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 2rem;
	border: 1px dashed var(--surface-5);
	border-radius: 1rem;
	text-align: center;
}
.retry-button {
	align-self: center;
	padding: 0.55rem 0.9rem;
	border: 1px solid var(--fakedrinth-accent, #ff5361);
	border-radius: 0.55rem;
	background: var(--fakedrinth-buttons, #d61f32);
	color: var(--fakedrinth-text, white);
	cursor: pointer;
}
@keyframes scene-sparkle {
	to {
		opacity: 0.2;
		transform: scale(0.35) rotate(45deg);
	}
}
</style>
