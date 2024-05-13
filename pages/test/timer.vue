<script setup>
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
const db = useDb()

const state = reactive({
  todayPomo: 0,

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

async function logEntry(pomoCount, secondCount) {
  const data = { 
    timestamp: new Date().toISOString(), 
    taskId: 1,
    projectId: 1,
    pomoCount,
    secondCount
  }
  await db.pomo.add(data)
}

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

  console.log('updateTask', state.menuTaskItem.id, data)
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

const taskMenuItems = [
  [
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
    id: 'amber-500'
  }
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

</script>

<template>
  <div>
    <div class="grid grid-flow-col gap-2 auto-cols-3 justify-center">
      <div>
        <UInput v-model="state.newTaskName" placeholder="Create a new task" @keyup.enter="createNewTask" />
        <div v-for="task in tasks" :key="task.id">
          <div class="p-2 my-2 dark:bg-slate-800 rounded-md">
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
              <span v-else>{{ task.name }} <span v-if="findProjects.has(task.projectId)" class="rounded-lg py-1 px-2 text-xs" :class="[`bg-${findProjects.get(task.projectId).colorId}`]">{{ findProjects.get(task.projectId).name }}</span></span>
            </div>
            <div>
              <USelectMenu v-if="state.editTaskProjectId != null" :options="projects" v-model="state.editTaskProjectId" by="id" option-attribute="name" value-attribute="id" @change="updateTask">
                <template #option="{ option: project }">
                  <span class="size-4 rounded-full" :class="`bg-${project.colorId}`" /> {{ project.name }}
                </template>
              </USelectMenu>
            </div>
          </div>
        </div>
      </div>
      <div>
        <LxTimer @completed="logEntry" />
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
            <span v-else>{{ project.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!--
  <UButton @click="refreshPomoCount">Refresh Pomo</UButton> 
  <div>Today: {{ state.todayPomo }}</div>
-->



  <UModal v-model="state.showColorSelector">
    <div class="flex gap-2 p-4">
      <div class="size-16 rounded-full" v-for="color in colorOptions" :class="[`bg-${color.id}`]" @click="selectColor(color.id)"></div>
    </div>
  </UModal>
</template>