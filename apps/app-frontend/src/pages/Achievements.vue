<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import achievementMedal from '@/assets/fakedrinth-achievement-medal.svg?url'
import beaconIcon from '@/assets/instance-icons/beacon.png'
import craftingTableIcon from '@/assets/instance-icons/crafting-table.png'
import enderDragonIcon from '@/assets/instance-icons/ender-dragon.png'
import pickaxeIcon from '@/assets/instance-icons/pickaxe.png'
import swordIcon from '@/assets/instance-icons/sword.png'
import { get_default_user_achievements } from '@/helpers/achievements'

const achievementsQuery = useQuery({
	queryKey: ['offline-achievements'],
	queryFn: get_default_user_achievements,
	staleTime: 30_000,
	refetchInterval: 10_000,
})
const achievements = computed(() => achievementsQuery.data.value?.achievements ?? [])
const achievementsError = computed(() => {
	const error = achievementsQuery.error.value
	return error instanceof Error ? error.message : error ? String(error) : ''
})
function achievementIcon(id: string): string {
	const key = id.toLowerCase()
	if (/(craft|planks|table|recipe|inventory)/.test(key)) return craftingTableIcon
	if (/(mine|stone|ore|iron|diamond|pickaxe|deepslate)/.test(key)) return pickaxeIcon
	if (/(dragon|elytra|end_city|end\/|shulker)/.test(key)) return enderDragonIcon
	if (/(nether|beacon|wither|blaze)/.test(key)) return beaconIcon
	if (/(combat|sword|monster|kill|raid|skeleton|zombie)/.test(key)) return swordIcon
	return achievementMedal
}
</script>

<template>
	<main class="achievements-page">
		<header class="achievements-header">
			<div class="achievements-icon"><img :src="achievementMedal" alt="" /></div>
			<div>
				<p>PERFIL OFFLINE</p>
				<h1>Logros del juego</h1>
				<span>Logros guardados localmente en tus mundos de Minecraft.</span>
			</div>
		</header>
		<div class="achievement-stage" aria-hidden="true">
			<div class="achievement-loader-art"><i></i><i></i><i></i><i></i></div>
			<div class="achievement-scene-art">
				<span class="scene-star star-a"></span><span class="scene-star star-b"></span>
				<span class="scene-star star-c"></span><span class="scene-star star-d"></span>
				<div class="scene-trophy"><i></i><b></b></div>
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
				<strong>{{ achievements.length }}</strong
				><span>logros obtenidos</span>
				<strong>{{ achievementsQuery.data.value?.worldCount ?? 0 }}</strong
				><span>mundos revisados</span>
			</div>
			<article v-if="achievements[0]" class="latest-achievement-card">
				<div class="latest-achievement-emblem">
					<img :src="achievementIcon(achievements[0].id)" alt="" />
				</div>
				<div>
					<small>ÚLTIMO LOGRO CONSEGUIDO</small>
					<strong>{{ achievements[0].name }}</strong>
					<span>{{ achievements[0].world }}</span>
				</div>
				<time v-if="achievements[0].date" :datetime="new Date(achievements[0].date).toISOString()">
					{{ new Date(achievements[0].date).toLocaleDateString() }}
				</time>
			</article>
			<div v-if="achievements.length" class="achievements-grid">
				<article v-for="achievement in achievements" :key="achievement.id" class="achievement-card">
					<img class="achievement-card-icon" :src="achievementIcon(achievement.id)" alt="" />
					<div>
						<strong>{{ achievement.name }}</strong
						><small>{{ achievement.world }}</small>
					</div>
					<time v-if="achievement.date" :datetime="new Date(achievement.date).toISOString()">
						{{ new Date(achievement.date).toLocaleDateString() }}
					</time>
				</article>
			</div>
			<div v-else class="achievements-state">
				<strong>Aún no hay logros registrados</strong>
				<span
					>Juega en un mundo local y vuelve aquí para ver los avances de esta cuenta offline.</span
				>
			</div>
		</template>
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
.achievement-loader-art {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.45rem;
	height: 100%;
	padding: 0 2.5rem;
}
.achievement-loader-art i {
	width: 0.55rem;
	height: 0.55rem;
	border-radius: 2px;
	background: var(--fakedrinth-accent, #ff5361);
	opacity: 0.3;
	animation: loading-cubes 0.9s ease-in-out infinite alternate;
}
.achievement-loader-art i:nth-child(2) {
	animation-delay: 0.15s;
}
.achievement-loader-art i:nth-child(3) {
	animation-delay: 0.3s;
}
.achievement-loader-art i:nth-child(4) {
	animation-delay: 0.45s;
}
.achievement-scene-art {
	position: relative;
	width: 12rem;
	height: 100%;
	margin-right: 3rem;
}
.scene-trophy {
	position: absolute;
	right: 2.5rem;
	bottom: 1.35rem;
	width: 3rem;
	height: 2.6rem;
	border: 3px solid #ffd18b;
	border-radius: 0.35rem 0.35rem 1rem 1rem;
	background: linear-gradient(140deg, #ffcc65, #d12a41 70%);
	box-shadow: 0 0 1.8rem color-mix(in srgb, var(--fakedrinth-accent, #ff5361) 55%, transparent);
	animation: trophy-bob 2.3s ease-in-out infinite;
}
.scene-trophy::before,
.scene-trophy::after {
	position: absolute;
	top: 0.35rem;
	width: 0.65rem;
	height: 0.9rem;
	border: 3px solid #ffd18b;
	content: '';
}
.scene-trophy::before {
	left: -0.82rem;
	border-right: 0;
	border-radius: 0.5rem 0 0 0.5rem;
}
.scene-trophy::after {
	right: -0.82rem;
	border-left: 0;
	border-radius: 0 0.5rem 0.5rem 0;
}
.scene-trophy i {
	position: absolute;
	bottom: -0.7rem;
	left: 50%;
	width: 1.15rem;
	height: 0.45rem;
	transform: translateX(-50%);
	border-radius: 0 0 0.3rem 0.3rem;
	background: #ffd18b;
}
.scene-trophy b {
	position: absolute;
	bottom: -1rem;
	left: 50%;
	width: 2.1rem;
	height: 0.25rem;
	transform: translateX(-50%);
	border-radius: 1rem;
	background: #ffd18b;
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
.achievement-card time {
	flex: none;
	color: var(--color-secondary);
	font-size: 0.75rem;
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
@keyframes loading-cubes {
	to {
		opacity: 1;
		transform: translateY(-0.4rem) scale(1.2);
	}
}
@keyframes trophy-bob {
	50% {
		transform: translateY(-0.35rem) rotate(3deg);
	}
}
@keyframes scene-sparkle {
	to {
		opacity: 0.2;
		transform: scale(0.35) rotate(45deg);
	}
}
</style>
