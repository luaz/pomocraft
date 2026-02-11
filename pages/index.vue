<script setup>
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
import { bg } from "@nuxt/ui/runtime/locale/index.js";
defineOptions({
  inheritAttrs: false,
});
const db = useDb();

const state = reactive({
  // motivationText: '',
  // showMotivationTextAnim: false,
  // showFocusModal: false,
  showFocus: false,
  focusProgress: 0,
  timerText: "",

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
});

const timerRef = ref(null);

async function addPomo(pomoCount, secondCount) {
  const data = {
    timestamp: new Date().toISOString(),
    taskId: state.activeTask.id,
    projectId: state.activeTask.projectId,
    pomoCount,
    secondCount,
  };
  await db.pomo.add(data);

  if (data.projectId) {
    const project = findProjects.value.get(data.projectId);
    await db.project.update(project.id, {
      pomoCount: (project.pomoCount || 0) + pomoCount,
      secondCount: (project.secondCount || 0) + secondCount,
    });
  }

  if (data.taskId) {
    const task = findTasks.value.get(data.taskId);
    await db.task.update(task.id, {
      pomoCount: (task.pomoCount || 0) + pomoCount,
      secondCount: (task.secondCount || 0) + secondCount,
    });
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
      .where("timestamp")
      .between(today.toISOString(), tomorrow.toISOString())
      .toArray();
  }),
);

const yesterdayPomos = useObservable(
  liveQuery(async () => {
    const start = new Date(); // yesterday
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(); // today
    end.setHours(0, 0, 0, 0);

    return await db.pomo
      .where("timestamp")
      .between(start.toISOString(), end.toISOString())
      .toArray();
  }),
);

const weekPomos = useObservable(
  liveQuery(async () => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    // start.setHours(0, 0, 0, 0);

    const end = new Date();
    // end.setHours(0, 0, 0, 0);

    return await db.pomo
      .where("timestamp")
      .between(start.toISOString(), end.toISOString())
      .toArray();
  }),
);

const todayPomoStat = computed(() => {
  let pomoCount = 0;
  let secondCount = 0;
  todayPomos?.value?.forEach((obj) => {
    pomoCount += obj.pomoCount;
    secondCount += obj.secondCount;
  });

  return {
    pomoCount,
    secondCount,
  };
});

const yesterdayPomoStat = computed(() => {
  let pomoCount = 0;
  let secondCount = 0;
  yesterdayPomos?.value?.forEach((obj) => {
    pomoCount += obj.pomoCount;
    secondCount += obj.secondCount;
  });

  return {
    pomoCount,
    secondCount,
  };
});

const weekPomoStat = computed(() => {
  let pomoCount = 0;
  let secondCount = 0;
  weekPomos?.value?.forEach((obj) => {
    pomoCount += obj.pomoCount;
    secondCount += obj.secondCount;
  });

  return {
    pomoCount,
    secondCount,
  };
});

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours <= 0 && minutes <= 0) return `${String(secs).padStart(2, "0")}s`;
  else if (hours <= 0)
    return `${String(minutes).padStart(2, "0")}m${String(secs).padStart(2, "0")}s`;
  return `${String(hours).padStart(2, "0")}h${String(minutes).padStart(2, "0")}m`;
}

async function createNewTask() {
  const data = {
    name: state.newTaskName,
    projectId: 0,
    active: 1,
  };
  await db.task.add(data);
  state.newTaskName = "";
}

async function updateTask() {
  let data = {};
  if (state.editTaskName) data.name = state.editTaskName;
  if (state.editTaskProjectId) data.projectId = state.editTaskProjectId;

  await db.task.update(state.menuTaskItem.id, data);

  state.editTaskId = null;
  state.editTaskName = null;
  state.editTaskProjectId = null;
}

const tasks = useObservable(
  liveQuery(async () => {
    return await db.task.where("active").equals(1).toArray();
  }),
);

const findTasks = computed(() => {
  return new Map(tasks?.value?.map((item) => [item.id, item]));
});

const taskMenuItems = [
  [
    {
      label: "Start",
      onSelect: () => {
        state.activeTask = state.menuTaskItem;
      },
    },
    {
      label: "Edit",
      onSelect: async () => {
        state.editTaskId = state.menuTaskItem.id;
        state.editTaskName = state.menuTaskItem.name;
      },
    },
    {
      label: "Project",
      onSelect: () => {
        state.editTaskProjectId = state.menuTaskItem.projectId || 0;
      },
    },
    {
      label: "Delete",
      onSelect: async () => {
        await db.task.update(state.menuTaskItem.id, { active: 0 });
      },
    },
  ],
];

async function createNewProject() {
  const data = {
    name: state.newProjectName,
    active: 1,
  };
  await db.project.add(data);
  state.newProjectName = "";
}

async function updateProject() {
  const data = {
    name: state.editProjectName,
  };
  await db.project.update(state.editProjectId, data);
  state.editProjectId = null;
  state.editProjectName = null;
}

const projects = useObservable(
  liveQuery(async () => {
    return await db.project.where("active").equals(1).toArray();
  }),
);

const projectItems = computed(() => {
  return (projects.value || []).map(({ id, name, colorId }) => ({
    id,
    label: name,
    colorId,
  }));
});

const findProjects = computed(() => {
  return new Map(projects?.value?.map((item) => [item.id, item]));
});

const projectMenuItems = [
  [
    {
      label: "Edit",
      onSelect: async () => {
        state.editProjectId = state.menuProjectItem.id;
        state.editProjectName = state.menuProjectItem.name;
      },
    },
    {
      label: "Color",
      onSelect: () => {
        state.showColorSelector = true;
      },
    },
    {
      label: "Delete",
      onSelect: async () => {
        await db.project.update(state.menuProjectItem.id, { active: 0 });
      },
    },
  ],
];

const colorOptions = [
  {
    id: "red-500",
    bg: "bg-red-500",
  },
  {
    id: "orange-500",
    bg: "bg-orange-500",
  },
  {
    id: "amber-500",
    bg: "bg-amber-500",
  },
  {
    id: "yellow-500",
    bg: "bg-yellow-500",
  },
  {
    id: "lime-500",
    bg: "bg-lime-500",
  },
  {
    id: "green-500",
    bg: "bg-green-500",
  },
  {
    id: "emerald-500",
    bg: "bg-emerald-500",
  },
  {
    id: "teal-500",
    bg: "bg-teal-500",
  },
  {
    id: "cyan-500",
    bg: "bg-cyan-500",
  },
  {
    id: "sky-500",
    bg: "bg-sky-500",
  },
  {
    id: "blue-500",
    bg: "bg-blue-500",
  },
  {
    id: "indigo-500",
    bg: "bg-indigo-500",
  },
  {
    id: "violet-500",
    bg: "bg-violet-500",
  },
  {
    id: "purple-500",
    bg: "bg-purple-500",
  },
  {
    id: "fuchsia-500",
    bg: "bg-fuchsia-500",
  },
  {
    id: "pink-500",
    bg: "bg-pink-500",
  },
  {
    id: "rose-500",
    bg: "bg-rose-500",
  },
];

async function selectColor(colorId) {
  await db.project.update(state.menuProjectItem.id, { colorId });
  state.showColorSelector = false;
}

function formatListItemClass(item) {
  if (item.colorId) {
    return [`bg-${item.colorId}`];
  }
  return ["dark:bg-slate-800"];
}
</script>

<template>
  <div v-bind="$attrs">
    <LxFocus
      v-if="state.showFocus"
      :progress="state.focusProgress"
      :timerText="state.timerText"
      :taskName="state.activeTask?.name"
      @closed="state.showFocus = false"
      @completed="
        state.showFocus = false;
        timerRef.changeMode();
      "
    />

    <div>
      <h1 class="text-2xl my-3">PomoCraft</h1>

      <div class="grid grid-flow-col gap-2 auto-cols-3 justify-center">
        <div>
          <UInput
            class="w-full"
            v-model="state.newTaskName"
            placeholder="Create a new task"
            @keyup.enter="createNewTask"
          />
          <div v-for="task in tasks" :key="task.id">
            <div
              class="p-2 my-2 rounded-md"
              :class="[
                state.activeTask?.id == task.id
                  ? 'dark:bg-gray-700'
                  : 'dark:bg-slate-800',
              ]"
            >
              <div class="flex items-center">
                <UDropdownMenu
                  :items="taskMenuItems"
                  :content="{ side: 'bottom', align: 'start' }"
                >
                  <UButton
                    @click="state.menuTaskItem = task"
                    :padded="false"
                    color="gray"
                    variant="link"
                    icon="i-heroicons-ellipsis-vertical"
                  />
                </UDropdownMenu>
                <span v-if="state.editTaskId == task.id"
                  ><UInput
                    v-model="state.editTaskName"
                    placeholder="Project name"
                    @keyup.enter="updateTask"
                /></span>
                <div v-else class="w-full">
                  <div v-if="task.pomoCount" class="ms-1 text-xs float-right">
                    {{ task.pomoCount }} x 🍅 ({{
                      formatTime(task.secondCount)
                    }})
                  </div>
                  {{ task.name }}
                  <span
                    v-if="findProjects.has(task.projectId)"
                    class="rounded-lg py-1 px-2 text-xs whitespace-nowrap"
                    :class="[`bg-${findProjects.get(task.projectId).colorId}`]"
                    >{{ findProjects.get(task.projectId).name }}</span
                  >
                </div>
              </div>
              <div>
                <USelectMenu
                  class="w-full"
                  v-if="
                    state.editTaskProjectId != null &&
                    state.menuTaskItem?.id == task.id
                  "
                  :items="projectItems"
                  v-model="state.editTaskProjectId"
                  value-key="id"
                  @change="updateTask"
                >
                  <template #item-leading="{ item }">
                    <span
                      class="size-4 rounded-full"
                      :class="`bg-${item.colorId}`"
                    />
                  </template>
                </USelectMenu>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-center min-w-60">
          <LxTimer
            ref="timerRef"
            :taskName="state.activeTask?.name"
            @completed="addPomo"
            @startFocus="state.showFocus = true"
            @focusProgress="(value) => (state.focusProgress = value)"
            @timerText="(value) => (state.timerText = value)"
          />

          <div>
            <div class="flex">
              <div class="min-w-20 text-right me-2">Today:</div>
              {{ todayPomoStat.pomoCount }} x 🍅 ({{
                formatTime(todayPomoStat.secondCount)
              }})
            </div>
            <div class="flex">
              <div class="min-w-20 text-right me-2">Yesterday:</div>
              {{ yesterdayPomoStat.pomoCount }} x 🍅 ({{
                formatTime(yesterdayPomoStat.secondCount)
              }})
            </div>
            <div class="flex">
              <div class="min-w-20 text-right me-2">1 Week:</div>
              {{ weekPomoStat.pomoCount }} x 🍅 ({{
                formatTime(weekPomoStat.secondCount)
              }})
            </div>
          </div>
        </div>
        <div>
          <UInput
            class="w-full"
            v-model="state.newProjectName"
            placeholder="Create a new project"
            @keyup.enter="createNewProject"
          />
          <div v-for="project in projects" :key="project.id">
            <div
              class="p-2 my-2 rounded-md flex items-center"
              :class="formatListItemClass(project)"
            >
              <UDropdownMenu
                :items="projectMenuItems"
                :content="{ side: 'bottom', align: 'start' }"
              >
                <UButton
                  @click="state.menuProjectItem = project"
                  :padded="false"
                  color="gray"
                  variant="link"
                  icon="i-heroicons-ellipsis-vertical"
                />
              </UDropdownMenu>
              <span v-if="state.editProjectId == project.id">
                <UInput
                  v-model="state.editProjectName"
                  placeholder="Project name"
                  @keyup.enter="updateProject"
                />
              </span>
              <div v-else class="w-full">
                <div v-if="project.pomoCount" class="ms-1 text-xs float-right">
                  {{ project.pomoCount }} x 🍅 ({{
                    formatTime(project.secondCount)
                  }})
                </div>
                {{ project.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="state.showColorSelector" title="Select a color">
      <template #body>
        <div class="flex gap-2 p-4">
          <div
            class="size-16 rounded-full"
            v-for="color in colorOptions"
            :class="[`bg-${color.id}`]"
            @click="selectColor(color.id)"
          ></div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
@keyframes rock {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(30deg);
  }
  50% {
    transform: rotate(0deg);
  }
  75% {
    transform: rotate(-30deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.animate-rock {
  animation: rock 2.5s infinite;
}

@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

.animate-fade-in-out {
  animation: fadeInOut 8s infinite;
}
</style>
