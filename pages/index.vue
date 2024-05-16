<script setup>
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
const db = useDb()

const state = reactive({
  motivationText: '',
  showMotivationTextAnim: false,

  activeTask: null,

  newTaskName: null,
  menuTaskItem: null,
  editTaskId: null,
  editTaskName: null,
  editTaskProjectId: null,

  newProjectName: null,
  menuProjectItem: null,
  editProjectId: null,
  editProjectName: null,

  showColorSelector: false,
})  

async function addPomo(pomoCount, secondCount) {
  const data = { 
    timestamp: new Date().toISOString(), 
    taskId: state.activeTask.id,
    projectId: state.activeTask.projectId,
    pomoCount,
    secondCount
  }
  await db.pomo.add(data)

  if (data.projectId) {
    const project = findProjects.value.get(data.projectId)
    await db.project.update(project.id, { pomoCount: (project.pomoCount || 0) + pomoCount,  secondCount: (project.secondCount || 0) + secondCount })
  }

  if (data.taskId) {
    const task = findTasks.value.get(data.taskId)
    await db.task.update(task.id, { pomoCount: (task.pomoCount || 0) + pomoCount,  secondCount: (task.secondCount || 0) + secondCount })
  }
}

const todayPomos = useObservable(
  liveQuery(async () => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return await db.pomo
      .where('timestamp').between(today.toISOString(), tomorrow.toISOString())
      .toArray();
  })
)

const yesterdayPomos = useObservable(
  liveQuery(async () => {

    const start = new Date(); // yesterday
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0); 

    const end = new Date(); // today
    end.setHours(0, 0, 0, 0);

    return await db.pomo
      .where('timestamp').between(start.toISOString(), end.toISOString())
      .toArray();
  })
)

const weekPomos = useObservable(
  liveQuery(async () => {

    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(0, 0, 0, 0);

    return await db.pomo
      .where('timestamp').between(start.toISOString(), end.toISOString())
      .toArray();
  })
)

const todayPomoStat = computed(() => {
  let pomoCount = 0
  let secondCount = 0
  todayPomos?.value?.forEach(obj => {
    pomoCount += obj.pomoCount
    secondCount += obj.secondCount
  })

  return {
    pomoCount,
    secondCount
  }
})

const yesterdayPomoStat = computed(() => {
  let pomoCount = 0
  let secondCount = 0
  yesterdayPomos?.value?.forEach(obj => {
    pomoCount += obj.pomoCount
    secondCount += obj.secondCount
  })

  return {
    pomoCount,
    secondCount
  }
})

const weekPomoStat = computed(() => {
  let pomoCount = 0
  let secondCount = 0
  weekPomos?.value?.forEach(obj => {
    pomoCount += obj.pomoCount
    secondCount += obj.secondCount
  })

  return {
    pomoCount,
    secondCount
  }
})

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours <=0 && minutes <= 0)
    return `${String(secs).padStart(2, '0')}s`
  else if (hours <= 0)
    return `${String(minutes).padStart(2, '0')}m${String(secs).padStart(2, '0')}s`
  return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}m`
}

async function createNewTask() {
  const data = {
    name: state.newTaskName,
    projectId: 0,
    active: 1
  }
  await db.task.add(data)
  state.newTaskName = ''
}

async function updateTask() {
  let data = {}
  if (state.editTaskName)
    data.name = state.editTaskName
  if (state.editTaskProjectId)
    data.projectId = state.editTaskProjectId

  await db.task.update(state.menuTaskItem.id, data)

  state.editTaskId = null
  state.editTaskName = null
  state.editTaskProjectId = null
}

const tasks = useObservable(
  liveQuery(async () => {
    return await db.task
      .where('active').equals(1).toArray();      
  })
)

const findTasks = computed(() => {
  return new Map(tasks?.value?.map(item => [item.id, item]));
})

const taskMenuItems = [
  [
    {
      label: 'Start',
      click: () => {
        state.activeTask = state.menuTaskItem
      }
    },
    {
      label: 'Edit',
      click: async () => {
         state.editTaskId = state.menuTaskItem.id
         state.editTaskName = state.menuTaskItem.name
      }
    },
    {
      label: 'Project',
      click: () => {
        state.editTaskProjectId = state.menuTaskItem.projectId || 0
      }
    },
    {
      label: 'Delete',
      click: async () => {
         await db.task.update(state.menuTaskItem.id, { active: 0 })
      }
    },
  ]
]

async function createNewProject() {
  const data = {
    name: state.newProjectName,
    active: 1
  }
  await db.project.add(data)
  state.newProjectName = ''
}

async function updateProject() {
  const data = {
    name: state.editProjectName
  }
  await db.project.update(state.editProjectId, data)
  state.editProjectId = null
  state.editProjectName = null
}

const projects = useObservable(
  liveQuery(async () => {
    return await db.project
      .where('active').equals(1).toArray();   
  })
)

const findProjects = computed(() => {
  return new Map(projects?.value?.map(item => [item.id, item]));
})

const projectMenuItems = [
  [
    {
      label: 'Edit',
      click: async () => {
         state.editProjectId = state.menuProjectItem.id
         state.editProjectName = state.menuProjectItem.name
      }
    },
    {
      label: 'Color',
      click: () => {
        state.showColorSelector = true
      }
    },
    {
      label: 'Delete',
      click: async () => {
         await db.project.update(state.menuProjectItem.id, { active: 0 })
      }
    },
  ]
]

const colorOptions = [
  {
    id: 'red-500',
  },
  {
    id: 'orange-500',
  },
  {
    id: 'amber-500'
  },
  {
    id: 'yellow-500'
  },
  {
    id: 'lime-500'
  },
  {
    id: 'green-500'
  },
  {
    id: 'emerald-500'
  },
  {
    id: 'teal-500'
  },
  {
    id: 'cyan-500'
  },
  {
    id: 'sky-500'
  },
  {
    id: 'blue-500'
  },
  {
    id: 'indigo-500'
  },
  {
    id: 'violet-500'
  },
  {
    id: 'purple-500'
  },
  {
    id: 'fuchsia-500'
  },
  {
    id: 'pink-500'
  },
  {
    id: 'rose-500'
  },
]

async function selectColor(colorId) {
  await db.project.update(state.menuProjectItem.id, { colorId })
  state.showColorSelector = false
}

function formatListItemClass(item) {
  if (item.colorId) {
    return [`bg-${item.colorId}`]
  }
  return ['dark:bg-slate-800']
}

/*
const motivationTexts = [
  "Procrastination is the thief of time.",
  "The only way to do great work is to love what you do.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The successful warrior is the average man, with laser-like focus.",
  "Work during Focus Time, Procrastinate during Break Time"
]
let lastIndex = Math.floor(Math.random() * motivationTexts.length)

state.motivationText = motivationTexts[lastIndex]
state.showMotivationTextAnim = true

function changeMotivationText() {
  let randomIndex = Math.floor(Math.random() * motivationTexts.length)
  while (lastIndex == randomIndex)
    randomIndex = Math.floor(Math.random() * motivationTexts.length)

  state.motivationText = motivationTexts[randomIndex]
  state.showMotivationTextAnim = true

  lastIndex = randomIndex


}

watch(() => state.motivationText, () => {
  setTimeout(() => {
    state.showMotivationTextAnim = false;
  }, 1000 * 60 * 5 - 1000); // Adjust the timing to match the fade-out duration
});

onMounted(() => {
  setInterval(changeMotivationText, 1000 * 60 * 5);
})
 */

const motivationItems = [
  {
    text: 'Procrastination is the thief of time.',
    author: 'Edward Young',
    src: '1.jpg'
  },
  {
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    src: '2.jpg'
  },
  {
    text: 'Success is the sum of small efforts repeated day in and day out.',
    author: 'Robert Collier',
    src: '3.jpg'
  },
  {
    text: 'The successful warrior is the average man, with laser-like focus.',
    author: 'Bruce Lee',
    src: '4.jpg'
  },
  {
    text: 'You will never find time for anything. If you want time you must make it.',
    author: 'Charles Buxton',
    src: '5.jpg'
  },
  {
    text: 'The best way to predict the future is to create it.',
    author: 'Peter Drucker',
    src: '6.jpg'
  },
  {
    text: 'Your future is created by what you do today, not tomorrow.',
    author: 'Robert Kiyosaki',
    src: '7.jpg'
  },
  {
    text: "Don't wait. The time will never be just right.",
    author: 'Napoleon Hill',
    src: '8.jpg'
  },
  {
    text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    author: 'Stephen Covey',
    src: '9.jpg'
  },
  {
    text: 'The future depends on what you do today.',
    author: 'Mahatma Gandhi',
    src: '10.jpg'
  }
]

const carouselRef = ref()

onMounted(() => {
  setInterval(() => {
    if (!carouselRef.value) return

    if (carouselRef.value.page === carouselRef.value.pages) {
      return carouselRef.value.select(0)
    }

    carouselRef.value.next()
  }, 1000 * 60 * 5)
})

</script>

<template>
  <div>
    <h1 class="text-2xl my-3">PomoCraft</h1>

    <div class="grid grid-flow-col gap-2 auto-cols-3 justify-center">
      <div>
        <UInput v-model="state.newTaskName" placeholder="Create a new task" @keyup.enter="createNewTask" />
        <div v-for="task in tasks" :key="task.id">
          <div class="p-2 my-2 dark:bg-slate-800 rounded-md" :class="{ 'dark:bg-gray-500': state.activeTask?.id == task.id }">
            <div class="flex items-center">
              <UDropdown :items="taskMenuItems" :popper="{ placement: 'bottom-start' }" @click="state.menuTaskItem = task">
                <UButton
                  :padded="false"
                  color="gray"
                  variant="link"
                  icon="i-heroicons-ellipsis-vertical"
                /> 
              </UDropdown>
              <span v-if="state.editTaskId == task.id"><UInput v-model="state.editTaskName" placeholder="Project name" @keyup.enter="updateTask" /></span>
              <div v-else class=" w-full">
                <div v-if="task.pomoCount" class="ms-1 text-xs float-right">{{ task.pomoCount }} x 🍅 ({{ formatTime(task.secondCount) }})</div>
                {{ task.name }} 
                <span v-if="findProjects.has(task.projectId)" class="rounded-lg py-1 px-2 text-xs whitespace-nowrap" :class="[`bg-${findProjects.get(task.projectId).colorId}`]">{{ findProjects.get(task.projectId).name }}</span>
              </div>
            </div>
            <div>
              <USelectMenu v-if="state.editTaskProjectId != null && state.menuTaskItem?.id == task.id" :options="projects" v-model="state.editTaskProjectId" option-attribute="name" value-attribute="id" @change="updateTask">
                <template #option="{ option: project }">
                  <span class="size-4 rounded-full" :class="`bg-${project.colorId}`" /> {{ project.name }}
                </template>
              </USelectMenu>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col items-center min-w-60">
        <LxTimer @completed="addPomo" :taskName="state.activeTask?.name" />
        <div>
          <div class="flex"><div class="min-w-20 text-right me-2">Today:</div> {{  todayPomoStat.pomoCount }} x 🍅 ({{ formatTime(todayPomoStat.secondCount) }})</div>
          <div class="flex"><div class="min-w-20 text-right me-2">Yesterday:</div> {{  yesterdayPomoStat.pomoCount }} x 🍅 ({{ formatTime(yesterdayPomoStat.secondCount) }})</div>
          <div class="flex"><div class="min-w-20 text-right me-2">1 Week:</div> {{  weekPomoStat.pomoCount }} x 🍅 ({{ formatTime(weekPomoStat.secondCount) }})</div>
        </div>
      </div>
      <div>
        <UInput v-model="state.newProjectName" placeholder="Create a new project" @keyup.enter="createNewProject" />
        <div v-for="project in projects" :key="project.id">
          <div class="p-2 my-2 rounded-md flex items-center" :class="formatListItemClass(project)">
            <UDropdown :items="projectMenuItems" :popper="{ placement: 'bottom-start' }" @click="state.menuProjectItem = project">
              <UButton
                :padded="false"
                color="gray"
                variant="link"
                icon="i-heroicons-ellipsis-vertical"
              /> 
            </UDropdown>
            <span v-if="state.editProjectId == project.id"><UInput v-model="state.editProjectName" placeholder="Project name" @keyup.enter="updateProject" /></span>
            <div v-else class=" w-full">{{ project.name }} <div v-if="project.pomoCount" class="text-xs float-right">{{  project.pomoCount }} x 🍅 ({{ formatTime(project.secondCount) }})</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!--
  <client-only>
    <UAlert
      class="my-5"
    >
      <template #title="{ title }">
        <transition name="slide-fade">
          <div class="flex items-center justify-center min-h-12">
            <div v-if="state.showMotivationTextAnim" class="text-2xl font-normal text-orange-200 text-center"  v-html="state.motivationText" />
          </div>
        </transition>
      </template>
    </UAlert>
  </client-only>
   -->

  <UCarousel ref="carouselRef" v-slot="{ item }" :items="motivationItems" :ui="{ item: 'w-full' }" indicators>
    <UAlert>
      <template #description>
        <div class="flex flex-col items-center justify-center mb-8">
          <div class="flex items-center text-2xl font-semibold text-orange-100 my-3 min-h-12">{{ item.text }}</div> 
          <div class="text-sm my-3">{{ item.author }}</div>
        </div>
      </template>
    </UAlert>
  </UCarousel>


  <UModal v-model="state.showColorSelector">
    <div class="flex gap-2 p-4">
      <div class="size-16 rounded-full" v-for="color in colorOptions" :class="[`bg-${color.id}`]" @click="selectColor(color.id)"></div>
    </div>
  </UModal>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>