<script setup>
defineProps(['title'])

const emit = defineEmits(['completed'])

const Mode = {
  IDLE: 1,
  RUNNING: 2,
  PAUSED: 3,
  COMPLETED: 4,
  RESTING: 5
}

let timerId = null
let seconds = 0
const POMO_FOCUS_SECONDS = 10 // 60* 25
const POMO_REST_SECONDS = 5

const state = reactive({ 
  mode: Mode.IDLE, // idle / running / paused
  timerText: formatTime(POMO_FOCUS_SECONDS)
})

const modeText = computed(() => { 
  if (state.mode == Mode.RUNNING) return 'Focus'
  else if (state.mode == Mode.COMPLETED) return 'Take a break'
  else if (state.mode == Mode.RESTING) return 'Taking a break'
  else if (state.mode == Mode.IDLE) return "Let's start"
})

function changeMode() {
  if (state.mode == Mode.IDLE || state.mode == Mode.RESTING) {
    state.mode = Mode.RUNNING
    seconds = POMO_FOCUS_SECONDS
    if (timerId)
       clearInterval(timerId)
    timerId = setInterval(updateTimer, 1000)

  }
  else if (state.mode == Mode.RUNNING) {
    seconds = POMO_FOCUS_SECONDS
    state.timerText = formatTime(seconds) 
    state.mode = Mode.IDLE
    clearInterval(timerId)
    timerId = null
  }
  else if (state.mode == Mode.COMPLETED) {
    seconds = POMO_REST_SECONDS
    state.timerText = formatTime(seconds)
    state.mode = Mode.RESTING
    if (timerId)
       clearInterval(timerId)    
    timerId = setInterval(updateTimer, 1000)
    emit('completed', 1, POMO_FOCUS_SECONDS)
  }
}

function updateTimer() {
  seconds--
  if (seconds >= 0) {
    state.timerText = formatTime(seconds) 
    
  }
  else if (state.mode == Mode.RUNNING) {
    state.mode = Mode.COMPLETED
    if (seconds == -1) {
      showNotification('Pomodoro Completed')
    }
  }
  else if (state.mode == Mode.RESTING) {
    state.mode = Mode.IDLE
  }
}

function formatTime(seconds) {
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function showNotification(message) {
  console.log('showNotification', Notification.permission)
  if (Notification.permission === 'granted') {
    // Create a new notification
    new Notification(message);
  } else if (Notification.permission !== 'denied') {
    // Request permission from the user
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        // Create a new notification
        new Notification(message);
      }
    });
  }
}

watch(() => state.timerText, (timerText) => {  document.title = timerText })

</script>

<template>
  <div class="flex w-60 py-4 px-8 rounded-md" :class="{ 'bg-slate-100': state.mode == Mode.IDLE, 'bg-lime-100': state.mode == Mode.RUNNING, 'bg-red-100': state.mode == Mode.COMPLETED, 'bg-orange-100': state.mode == Mode.RESTING }">
    <div class="flex-1 justify-center">
      <div class="text-center text-sm text-slate-500">{{ modeText }}</div>
      <div class="text-center text-5xl font-medium dark:text-slate-500">{{ state.timerText }}</div>
    </div>

    <!--
    <div class="flex justify-center items-center">
      <UIcon name="i-heroicons-light-bulb" class="size-6" />
    </div>
     -->

    <!--
    <div class="flex justify-center items-center">
      <UButton
        icon="i-heroicons-play-circle"
        size="xl"
        color="gray"
        variant="link"
      />
    </div>
     -->

    <div class="flex justify-center items-center">
      <UButton color="gray" variant="link">
        <UIcon v-show="state.mode == Mode.IDLE || state.mode == Mode.RESTING" name="i-heroicons-play-circle" class="size-8" @click="changeMode" />
        <UIcon v-show="state.mode == Mode.RUNNING" name="i-heroicons-stop-circle" class="size-8" @click="changeMode" />
        <UIcon v-show="state.mode == Mode.COMPLETED" name="i-heroicons-face-smile" class="size-8" @click="changeMode" />
      </UButton>
    </div>
  </div>
</template>