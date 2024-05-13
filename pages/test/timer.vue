<script setup>
const db = useDb()

const state = reactive({
  logs: [],
  todayPomo: 0
})  

async function logEntry(pomoCount, secondCount) {
  const data = { 
    timestamp: new Date().toISOString(), 
    taskId: 1,
    projectId: 1,
    pomoCount,
    secondCount
  }
  state.logs.push(data)
  await db.pomo.add(data)
}

const logMessage = computed(() => state.logs.map(obj => JSON.stringify(obj)).join('\n'))

async function refreshPomoCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);


  const rows = await db.pomo
      .where('timestamp').between(today.toISOString(), tomorrow.toISOString())
      .toArray();

  let total = 0
  rows.forEach(obj => {
    total += obj.pomoCount
  })
  state.todayPomo = total
}
</script>

<template>
  I am a timer
  <LxTimer @completed="logEntry" />

  <pre>
{{ logMessage }}
  </pre>

  <UButton @click="refreshPomoCount">Refresh Pomo</UButton> 
  <div>Today: {{ state.todayPomo }}</div>
</template>