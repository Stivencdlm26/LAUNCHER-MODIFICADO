<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const open = ref(false)
const logText = ref('')
const loading = ref(false)
const error = ref('')
let refreshInterval: number | undefined

async function refresh() {
	if (loading.value) return
	loading.value = true
	error.value = ''
	const sessionLog = await invoke<string>('plugin:logs|logs_get_launcher_log_tail').catch(
		(cause) => `No se pudo leer el archivo de sesión: ${String(cause)}`,
	)
	logText.value = sessionLog
	loading.value = false
}

watch(open, (isOpen) => {
	if (isOpen) void refresh()
	if (isOpen) {
		refreshInterval = window.setInterval(() => void refresh(), 3000)
	} else if (refreshInterval !== undefined) {
		window.clearInterval(refreshInterval)
		refreshInterval = undefined
	}
})

function handleKeydown(event: KeyboardEvent) {
	if (event.ctrlKey && event.shiftKey && event.key === 'F12') {
		event.preventDefault()
		event.stopPropagation()
		open.value = !open.value
	} else if (event.key === 'Escape' && open.value) {
		open.value = false
	}
}

async function copyLogs() {
	try {
		await navigator.clipboard.writeText(logText.value)
	} catch (cause) {
		error.value = `No se pudo copiar el registro: ${cause instanceof Error ? cause.message : String(cause)}`
	}
}

async function openLogFolder() {
	try {
		await invoke('plugin:utils|show_launcher_logs_folder')
	} catch (cause) {
		error.value = `No se pudo abrir la carpeta: ${cause instanceof Error ? cause.message : String(cause)}`
	}
}

onMounted(() => window.addEventListener('keydown', handleKeydown, true))
onBeforeUnmount(() => {
	window.removeEventListener('keydown', handleKeydown, true)
	if (refreshInterval !== undefined) window.clearInterval(refreshInterval)
})
</script>

<template>
	<Teleport to="body">
		<div
			v-if="open"
			class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-5"
			role="dialog"
			aria-modal="true"
			aria-label="Diagnóstico de FAKEDRINH"
			@click.self="open = false"
		>
			<section
				class="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-600 bg-[#111] text-gray-100 shadow-2xl"
			>
				<header
					class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 bg-[#202020] px-5 py-3"
				>
					<div>
						<h2 class="m-0 text-lg font-semibold">Consola de diagnóstico</h2>
						<p class="m-0 text-sm text-gray-400">
							Últimas 800 líneas · se actualiza automáticamente mientras está abierto
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							class="rounded border border-gray-600 px-3 py-2 hover:bg-gray-700"
							:disabled="loading"
							@click="refresh"
						>
							{{ loading ? 'Actualizando…' : 'Actualizar' }}
						</button>
						<button
							class="rounded border border-gray-600 px-3 py-2 hover:bg-gray-700"
							@click="copyLogs"
						>
							Copiar registro
						</button>
						<button
							class="rounded border border-gray-600 px-3 py-2 hover:bg-gray-700"
							@click="openLogFolder"
						>
							Abrir carpeta de logs
						</button>
						<button
							class="rounded border border-gray-600 px-3 py-2 hover:bg-gray-700"
							aria-label="Cerrar"
							@click="open = false"
						>
							Cerrar
						</button>
					</div>
				</header>
				<p
					v-if="error"
					class="m-0 border-b border-red-900 bg-red-950 px-5 py-2 text-sm text-red-200"
				>
					{{ error }}
				</p>
				<pre
					class="m-0 min-h-64 flex-1 overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-xs leading-5 text-gray-200"
					>{{ logText || 'Aún no hay líneas en el registro.' }}</pre
				>
				<footer class="border-t border-gray-700 px-5 py-2 text-xs text-gray-400">
					Atajo: <kbd class="rounded border border-gray-600 px-1.5 py-0.5">Ctrl</kbd> +
					<kbd class="rounded border border-gray-600 px-1.5 py-0.5">Shift</kbd> +
					<kbd class="rounded border border-gray-600 px-1.5 py-0.5">F12</kbd> · Pulsa Esc para
					cerrar.
				</footer>
			</section>
		</div>
	</Teleport>
</template>
