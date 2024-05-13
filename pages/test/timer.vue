<script setup>
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
const db = useDb()

const state = reactive({
  todayPomo: 0,
  newTaskName: null,
  selectedMenuTask: null,
  newProjectName: null,
  menuProjectItem: null,
  editProjectName: null,

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

const tasks = useObservable(
  liveQuery(async () => {
    return await db.task
      .where('active').equals(1).toArray();      
  })
)

const taskMenuItems = [
  [
    {
      label: 'Delete',
      click: () => {
        alert(`Delete ${state.selectedMenuTask}`)
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
  await db.project.update(state.projectEditId, data)
  state.projectEditId = null
  state.editProjectName = null
}

const projects = useObservable(
  liveQuery(async () => {
    return await db.project
      .where('active').equals(1).toArray();   
  })
)

const projectMenuItems = [
  [
    {
      label: 'Edit',
      click: async () => {
         state.projectEditId = state.menuProjectItem.id
         state.editProjectName = state.menuProjectItem.name
      }
    },
    {
      label: 'Delete',
      click: async () => {
         await db.project.update(state.menuProjectItem.id, { active: 0 })
      }
    }
  ]
]

</script>

<template>
  I am a timer

  <div class="grid grid-flow-col auto-cols-max">
    <div>
      <UInput v-model="state.newTaskName" placeholder="Create a new task" @keyup.enter="createNewTask" />
      <div v-for="task in tasks" :key="task.id">
        <div class="p-2 my-2 dark:bg-slate-800 rounded-md flex items-center">
          <UDropdown :items="taskMenuItems" :popper="{ placement: 'bottom-start' }" @click="state.selectedMenuTask = task.id">
            <UButton
              :padded="false"
              color="gray"
              variant="link"
              icon="i-heroicons-ellipsis-vertical"
          /> 
          </UDropdown>
          <span>{{ task.name }}</span>
        </div>
      </div>
    </div>
    <div>
      <LxTimer @completed="logEntry" />
    </div>
    <div>
      <UInput v-model="state.newProjectName" placeholder="Create a new project" @keyup.enter="createNewProject" />
      <div v-for="project in projects" :key="project.id">
        <div class="p-2 my-2 dark:bg-slate-800 rounded-md flex items-center">
          <UDropdown :items="projectMenuItems" :popper="{ placement: 'bottom-start' }" @click="state.menuProjectItem = project">
            <UButton
              :padded="false"
              color="gray"
              variant="link"
              icon="i-heroicons-ellipsis-vertical"
          /> 
          </UDropdown>
          <span v-if="state.projectEditId == project.id"><UInput v-model="state.editProjectName" placeholder="Project name" @keyup.enter="updateProject" /></span>
          <span v-else>{{ project.name }}</span>
        </div>
      </div>
    </div>
  </div>

  <UButton @click="refreshPomoCount">Refresh Pomo</UButton> 
  <div>Today: {{ state.todayPomo }}</div>
</template>