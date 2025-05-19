<script setup>
const props = defineProps({
  taskName: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
  },
  timerText: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['closed', 'completed'])

// const progress = ref(0)
const animPosition = computed(() => {
  return (200 * (props.progress))
})
const barColor = computed(() => {
  if (props.progress <= 0.25) return 'bg-purple-300';
  if (props.progress <= 0.50) return 'bg-blue-500';
  if (props.progress <= 0.75) return 'bg-yellow-500';
  return 'bg-green-500'; // Gold-ish
});

const bgImgSrc = ref(`/img/motiv/${genRandomImageId(15)}.jpg`)

function genRandomImageId(total) {
  return Math.floor(Math.random() * total) + 1;
}

watch(
  () => props.progress,
  (newProgress) => {
    if (newProgress == 1) {
      bgImgSrc.value = `/img/done/${genRandomImageId(7)}.jpg`
    }
  }
)

/*
watch(
  () => props.progress,
  (newProgress) => {
    console.log(newProgress, props.timerText);

  }
);
 */

/*
let intervalId;

onMounted(() => {
  intervalId = setInterval(() => {
    if (progress.value < 100) {
      progress.value += 1;
    } else {
      clearInterval(intervalId);
    }

    if (progress.value % 10 === 0) {
      motiveImageId.value = genRandomImageId()
    }
  }, 300); // Increase by 1 every 100ms
});

onBeforeUnmount(() => {
  clearInterval(intervalId);
});
 */
</script>


<template>
  <div class="fixed inset-0 bg-black z-[1000]">

    <button
      @click="$emit('closed')"
      class="absolute top-1.5 right-1.5 text-gray-400 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/10 p-0 z-[1001]"
      aria-label="Close"
    >
      <UIcon name="i-heroicons-x-mark" class="size-10" @click="emit('closed')"/>
    </button>

    <!--
    <UButton
      variant="link"
      size="xl"
      icon="i-heroicons-x-circle"
      @click="$emit('closed')"
      class="absolute top-1.5 right-1.5 z-[1001]"
      aria-label="Close"
    />
     -->

    <div>
      <div>
        <div class="relative">
          <transition name="fade" mode="out-in">
            <img 
            :key="bgImgSrc"
            :src="bgImgSrc" 
            alt="Background" 
            class="w-full h-full object-cover" />
          </transition>

          <!--
          <div class="pointer-events-none absolute inset-0 flex justify-between">
            <div class="w-24 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
            <div class="w-24 bg-gradient-to-l from-black to-transparent"></div>
          </div>
           -->


          <!-- Foreground text -->

          <div class="absolute top-0 left-1/2 transform -translate-x-1/2 mt-2">
            <div class="py-3">
              <div class="relative w-full h-24 overflow-hidden">
                <NuxtImg
                  src="/img/anim/girl-mining.gif"
                  alt="Moving"
                  class="absolute top-0 h-24 transition-transform duration-300"
                  :style="{ transform: `translateX(${animPosition}%)` }"
                />
              </div>


              <div class="bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  class="rounded-full h-6 transition-all duration-500"
                  :class="barColor"
                  :style="{ width: (progress * 100) + '%' }"
                ></div>
              </div>
            </div>

            <div class="text-white text-8xl font-bold bg-black bg-opacity-30 px-4 pt-0 pb-4 m-0 rounded-xl min-w-80 text-center">
              {{ timerText || "00:00" }}
            </div>

            <div class="text-center text-xl text-white text-shadow-lg">
              {{ taskName }}
            </div>

            <div class="flex justify-center mt-5" v-if="progress == 1">
              <button
                @click="emit('completed')"
                class="
                  bg-gradient-to-r from-green-400 to-blue-500
                  text-white
                  px-8 py-4
                  rounded-full
                  shadow-lg
                  hover:shadow-xl
                  font-bold text-2xl
                  flex items-center gap-3
                  border-2 border-white/20
                  transition-all duration-300
                  hover:scale-105
                  focus:outline-none focus:ring-4 focus:ring-green-300/50
                "
              >
                <UIcon name="i-heroicons-check-circle" class="size-8" />
                Good Job!
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0.3;
}
</style>