<script setup>
const state = reactive({
  logs: []
})  

function logEntry() {
  state.logs.push({ timestamp: new Date(), task: '01' })
}

const logMessage = computed(() => state.logs.map(obj => JSON.stringify(obj)).join('\n'))
</script>

<template>
  I am a timer
  <LxTimer @completed="logEntry" />

  <pre>
{{ logMessage }}
  </pre>
</template>