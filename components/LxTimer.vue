<script setup>
import completeSound from "~/assets/sounds/complete.ogg";
import startSound from "~/assets/sounds/start.ogg";
import pingSound from "~/assets/sounds/ping.ogg";
  
const props = defineProps(['taskName'])

const emit = defineEmits(['completed', 'focusProgress'])

const Mode = {
  IDLE: 1,
  RUNNING: 2,
  PAUSED: 3,
  COMPLETED: 4,
  RESTING: 5
}

let timerId = null
let seconds = 0
let pingCount = 0
let timerStartTime = null
const POMO_FOCUS_SECONDS = process.dev ? 20 : 60 * 25
const POMO_REST_SECONDS = process.dev ? 5 : 60 * 5

const state = reactive({ 
  mode: Mode.IDLE, // idle / running / paused
  timerText: formatTime(POMO_FOCUS_SECONDS)
})

const modeText = computed(() => { 
  if (state.mode == Mode.RUNNING) return '🎯 Focus'
  else if (state.mode == Mode.COMPLETED) return '😌 Take a break'
  else if (state.mode == Mode.RESTING) return '☕ Taking a break'
  else if (state.mode == Mode.IDLE) return "🔥 Ready"
})

function changeMode() {
  if (blinkTimerId) {
     clearInterval(blinkTimerId)
     blinkTimerId = null
  }

  if (state.mode == Mode.IDLE || state.mode == Mode.RESTING) {
    if (!props.taskName) {
      alert('Select a Task')
      return
    }
    if (timerId)
       clearInterval(timerId)

    state.mode = Mode.RUNNING
    seconds = POMO_FOCUS_SECONDS
    timerStartTime = new Date()

    timerId = setInterval(updateTimer, 1000)

  }
  else if (state.mode == Mode.RUNNING) {
    seconds = POMO_FOCUS_SECONDS
    pingCount = 0
    state.timerText = formatTime(seconds) 
    state.mode = Mode.IDLE
    clearInterval(timerId)
    timerId = null
  }
  else if (state.mode == Mode.COMPLETED) {
    if (timerId)
       clearInterval(timerId) 

    seconds = POMO_REST_SECONDS
    timerStartTime = new Date()
    state.timerText = formatTime(seconds)
    state.mode = Mode.RESTING

    if (notification) {
      notification.close()
      notification = null
    }
   
    timerId = setInterval(updateTimer, 1000)
    emit('completed', 1, POMO_FOCUS_SECONDS)
  }
}

function updateTimer() {
  seconds--
  if (seconds > 0) {
    if (state.mode ==  Mode.RUNNING || state.mode == Mode.RESTING) {
      const realSeconds = (state.mode ==  Mode.RUNNING ? POMO_FOCUS_SECONDS : POMO_REST_SECONDS) - Math.ceil((new Date() - timerStartTime) / 1000)
      if (Math.abs(realSeconds - seconds) >= 2) {
        console.log(`Adjust ${seconds} => ${realSeconds}`)
        seconds = realSeconds
        if (seconds < 0) { // to avoid funny ui issues
          seconds = 0
        }
      }
    }
  }

  if (state.mode == Mode.RUNNING && seconds >= 0) {
    const progress = (POMO_FOCUS_SECONDS - seconds) / POMO_FOCUS_SECONDS
    // console.log(progress, '>', pingCount * (0.2))
    if (progress >= pingCount * 0.2 && progress < 1) {
      // console.log('ping', progress)
      pingCount++
      playSound(pingSound)
    }
    emit('focusProgress', progress)
  }
  

  if (seconds >= 0) {
    state.timerText = formatTime(seconds) 
  }
  else if (state.mode == Mode.RUNNING) {
    state.mode = Mode.COMPLETED
    if (seconds == -1) {
      playSound(completeSound)
      showNotification('Pomodoro Completed', [{ action: 'takeBreak', title: 'Take Break' }], (event) => {
        if (event.action === "takeBreak") {
          changeMode()
        }
      })
      blinkTimerId = blinkTitle('- Break Time -',  '☕')
    }
  }
  else if (state.mode == Mode.RESTING) {
    state.mode = Mode.IDLE
    if (seconds == -1) {
      playSound(startSound)
      blinkTimerId = blinkTitle('- Ready -',  '🟢')
    }
  }
}

function formatTime(seconds) {
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

let notification = null
function showNotification(message, actions, callback) {
  if (Notification.permission === 'granted') {
    // Create a new notification
    notification = new Notification(message, /*{ actions }*/)
    notification.onclick = (event) => callback(event)
    notification.addEventListener("close", () => {
      notification = null
    });
  } else if (Notification.permission !== 'denied') {
    // Request permission from the user
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        // Create a new notification
        notification = new Notification(message, /*{ actions }*/)
        notification.onclick = (event) => callback(event)
        notification.addEventListener("close", () => {
          notification = null
        });
      }
    });
  }
}

function playSound(file) {
  const audio = new Audio(file)

  // Play the audio
  audio.play();
}

let blinkCount = 0
let blinkTimerId = null

function blinkTitle(title, filler) {
  let isBlinking = false;

  blinkCount = 0
  return setInterval(() => {
    if (isBlinking) {
      document.title = title
      blinkCount++
    } else {
      document.title = filler
    }
    isBlinking = !isBlinking;

    if (blinkCount > 20 && blinkTimerId) {
      clearInterval(blinkTimerId)
      blinkTimerId = null
    }
  }, 600); // Blink interval in milliseconds (e.g., 500ms for half-second blink)
}

watch(() => state.timerText, (timerText) => { 
  if (state.mode == Mode.RESTING)
    document.title = `[B] ${timerText}`
  else
    document.title = timerText
})

watch(() => state.mode, (mode) => {
  if (mode != Mode.RUNNING && mode != Mode.COMPLETED) {
    emit('focusProgress', -1)
  }
})

</script>

<template>
  <div class="flex w-48 py-4 px-4 rounded-md" :class="{ 'bg-slate-100': state.mode == Mode.IDLE, 'bg-lime-100': state.mode == Mode.RUNNING, 'bg-red-100': state.mode == Mode.COMPLETED, 'bg-orange-100': state.mode == Mode.RESTING }">
    <div class="flex-1 items-center justify-center">
      <div class="text-center text-sm text-slate-500">{{ modeText }}</div>
      <div class="text-center text-5xl font-medium dark:text-slate-500 w-32" :class="{ 'animate-blink': state.mode == Mode.COMPLETED  }">{{ state.timerText }}</div>
      <div class="flex justify-center">
        <div class="text-center text-sm text-slate-700 font-medium w-32 whitespace-nowrap overflow-hidden text-ellipsis">
          {{ taskName || 'Select a Task' }}
        </div>
      </div>
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
      <UButton color="gray" variant="link" tabindex="-1">
        <UIcon v-show="state.mode == Mode.IDLE || state.mode == Mode.RESTING" name="i-heroicons-play-circle" class="size-8" @click="changeMode" />
        <UIcon v-show="state.mode == Mode.RUNNING" name="i-heroicons-stop-circle" class="size-8" @click="changeMode" />
        <UIcon v-show="state.mode == Mode.COMPLETED" name="i-heroicons-face-smile" class="size-8" @click="changeMode" />
      </UButton>
    </div>
  </div>
</template>