<script setup>
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
const db = useDb()

const state = reactive({
  todayPomo: 0,
  newTaskName: null
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
    //
    // Query the DB using our promise based API.
    // The end result will magically become
    // observable.
    //
    const data = await db.task
      .where('active').equals(1).toArray();      
    console.log(data)
    return data
  })
)
</script>

<template>
  I am a timer

  <div class="grid grid-flow-col auto-cols-max">
    <div>
      <UInput v-model="state.newTaskName" placeholder="Create a new task" @keyup.enter="createNewTask" />
      <div v-for="task in tasks" :key="task.id">
        - {{ task.name }}
      </div>
    </div>
    <div>
      <LxTimer @completed="logEntry" />
    </div>
    <div>
      Projects
    </div>
  </div>

  <UButton @click="refreshPomoCount">Refresh Pomo</UButton> 
  <div>Today: {{ state.todayPomo }}</div>
</template>