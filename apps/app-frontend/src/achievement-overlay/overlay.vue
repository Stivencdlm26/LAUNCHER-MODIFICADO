<script setup lang="ts">
import { emit, listen } from '@tauri-apps/api/event'
import { onMounted, onUnmounted, ref } from 'vue'
import achievementMedal from '@/assets/fakedrinth-achievement-medal.svg?url'

type AchievementToast = {
	name: string
	description: string
	world: string
	id: string
	unlockedLabel: string
}

const achievement = ref<AchievementToast | null>(null)
const visible = ref(false)
let hideTimer: number | undefined
let unlisten: (() => void) | undefined

async function playChime() {
	try {
		const AudioContextConstructor = window.AudioContext
		if (!AudioContextConstructor) return
		const audioContext = new AudioContextConstructor()
		if (audioContext.state === 'suspended') await audioContext.resume()
		const start = audioContext.currentTime
		for (const [index, frequency] of [587.33, 783.99, 1174.66].entries()) {
			const oscillator = audioContext.createOscillator()
			const gain = audioContext.createGain()
			const beginsAt = start + index * 0.085
			oscillator.type = 'triangle'
			oscillator.frequency.value = frequency
			gain.gain.setValueAtTime(0.0001, beginsAt)
			gain.gain.exponentialRampToValueAtTime(0.12, beginsAt + 0.02)
			gain.gain.exponentialRampToValueAtTime(0.0001, beginsAt + 0.32)
			oscillator.connect(gain)
			gain.connect(audioContext.destination)
			oscillator.start(beginsAt)
			oscillator.stop(beginsAt + 0.34)
		}
		window.setTimeout(() => void audioContext.close(), 800)
	} catch (error) {
		console.debug('Achievement sound could not be played:', error)
	}
}

onMounted(async () => {
	try {
		const palette = JSON.parse(localStorage.getItem('fakedrinth.custom-palette.v1') ?? '{}')
		for (const [key, variable] of [
			['buttons', '--fakedrinth-buttons'],
			['accent', '--fakedrinth-accent'],
			['text', '--fakedrinth-text'],
		] as const) {
			if (typeof palette[key] === 'string' && /^#[0-9a-f]{6}$/i.test(palette[key])) {
				document.documentElement.style.setProperty(variable, palette[key])
			}
		}
	} catch {
		// Keep the default red theme if the saved palette is unavailable.
	}
	unlisten = await listen<AchievementToast>('fakedrinth-achievement-toast', (event) => {
		achievement.value = event.payload
		visible.value = true
		void playChime()
		window.clearTimeout(hideTimer)
		hideTimer = window.setTimeout(() => (visible.value = false), 6200)
	})
	await emit('fakedrinth-achievement-overlay-ready')
})

onUnmounted(() => {
	unlisten?.()
	window.clearTimeout(hideTimer)
})
</script>

<template>
	<Transition name="achievement-toast">
		<article v-if="visible && achievement" class="toast-card" role="status">
			<div class="toast-glow"></div>
			<div class="toast-medal" aria-hidden="true">
				<img :src="achievementMedal" alt="" />
				<i class="spark spark-one"></i><i class="spark spark-two"></i
				><i class="spark spark-three"></i>
			</div>
			<div class="toast-copy">
			<p>{{ achievement.unlockedLabel }}</p>
				<strong>{{ achievement.name }}</strong>
			<small>{{ achievement.description }}</small>
			</div>
		</article>
	</Transition>
</template>

<style>
:root {
	font-family: Inter, system-ui, sans-serif;
	color: #fff1f2;
}
* {
	box-sizing: border-box;
}
html,
body,
#achievement-overlay {
	width: 100%;
	height: 100%;
	margin: 0;
	overflow: hidden;
	background: transparent;
}
.toast-card {
	position: relative;
	display: flex;
	align-items: center;
	gap: 1rem;
	width: 100%;
	height: 100%;
	padding: 0.9rem 1.15rem;
	overflow: hidden;
	border: 1px solid rgb(255 115 127 / 68%);
	border-radius: 999px;
	background: linear-gradient(120deg, rgb(35 12 17 / 96%), rgb(92 15 25 / 93%));
	box-shadow:
		0 14px 42px rgb(0 0 0 / 42%),
		inset 0 1px rgb(255 255 255 / 12%);
}
.toast-glow {
	position: absolute;
	inset: 0 auto 0 0;
	width: 4px;
	background: #ff3d54;
	box-shadow: 0 0 22px #ff3d54;
}
.toast-medal {
	position: relative;
	display: grid;
	flex: none;
	width: 4.5rem;
	height: 4.5rem;
	place-items: center;
	border: 2px solid rgb(255 205 210 / 82%);
	border-radius: 50%;
	background: radial-gradient(circle, rgb(255 255 255 / 20%), rgb(72 12 20 / 75%) 70%);
	box-shadow: 0 0 25px rgb(255 64 83 / 45%);
}
.toast-medal img {
	width: 3.8rem;
	height: 3.8rem;
	animation: medal-float 1.5s ease-in-out infinite;
}
.spark {
	position: absolute;
	width: 4px;
	height: 4px;
	border-radius: 50%;
	background: #ffe7a5;
	box-shadow: 0 0 9px #ffd976;
	animation: sparkle 1.3s ease-in-out infinite alternate;
}
.spark-one {
	top: 2px;
	right: 7px;
}
.spark-two {
	bottom: 5px;
	left: 2px;
	animation-delay: 0.4s;
}
.spark-three {
	top: 9px;
	left: 0;
	animation-delay: 0.8s;
}
.toast-copy {
	position: relative;
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.22rem;
}
.toast-copy p {
	margin: 0;
	color: #ff8994;
	font-size: 0.67rem;
	font-weight: 800;
	letter-spacing: 0.12em;
}
.toast-copy strong {
	font-size: 1.12rem;
	line-height: 1.15;
}
.toast-copy small {
	color: #d9b9bd;
	font-size: 0.78rem;
	line-height: 1.2;
}
.achievement-toast-enter-active,
.achievement-toast-leave-active {
	transition:
		opacity 0.25s ease,
		transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.achievement-toast-enter-from,
.achievement-toast-leave-to {
	transform: translateX(110%) scale(0.96);
	opacity: 0;
}
@keyframes medal-float {
	50% {
		transform: translateY(-3px) scale(1.06);
	}
}
@keyframes sparkle {
	to {
		opacity: 0.15;
		transform: scale(0.45);
	}
}
</style>
