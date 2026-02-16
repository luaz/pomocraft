<script setup>
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
defineOptions({
  inheritAttrs: false,
});
const db = useDb();
const { public: publicConfig } = useRuntimeConfig();

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
  taskSectionKey: "active",

  newProjectName: null,
  menuProjectItem: null,
  editProjectId: null,
  editProjectName: null,

  showColorSelector: false,
});

const dragState = reactive({
  taskId: null,
  overTaskId: null,
});

const timerRef = ref(null);

function getTaskSectionKey(task) {
  const tags = new Set(task.tags || []);
  if (task.active === 0) return "deleted";
  if (tags.has("completed")) return "completed";
  if (tags.has("keep")) return "keep";
  return "active";
}

function getTaskSectionRank(task) {
  const section = getTaskSectionKey(task);
  if (section === "active") return 0;
  if (section === "keep") return 1;
  if (section === "completed") return 2;
  return 3;
}

function getNextTaskSortOrder(sectionKey) {
  const maxSortOrder = (tasks?.value || [])
    .filter((task) => getTaskSectionKey(task) === sectionKey)
    .reduce((max, task) => {
      const order = Number(task.sortOrder);
      if (!Number.isFinite(order)) return max;
      return Math.max(max, order);
    }, 0);
  return maxSortOrder + 1;
}

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
    tags: [],
    sortOrder: getNextTaskSortOrder("active"),
  };
  await db.task.add(data);
  state.newTaskName = "";
}

async function updateTask() {
  let data = {};
  if (state.editTaskName) data.name = state.editTaskName;
  if (state.editTaskProjectId != null) data.projectId = state.editTaskProjectId;

  await db.task.update(state.editTaskId, data);

  state.editTaskId = null;
  state.editTaskName = null;
  state.editTaskProjectId = null;
}

const tasks = useObservable(
  liveQuery(async () => {
    const items = await db.task.toArray();
    // Backfill tags for backward compatibility
    items.forEach((task) => {
      if (!task.tags) {
        task.tags = [];
        if (task.completed === 1) task.tags.push("completed");
      }
    });

    return items.sort((a, b) => {
      const sectionDelta = getTaskSectionRank(a) - getTaskSectionRank(b);
      if (sectionDelta !== 0) return sectionDelta;

      const aSortOrder = Number.isFinite(Number(a.sortOrder))
        ? Number(a.sortOrder)
        : Number.MAX_SAFE_INTEGER;
      const bSortOrder = Number.isFinite(Number(b.sortOrder))
        ? Number(b.sortOrder)
        : Number.MAX_SAFE_INTEGER;
      const sortOrderDelta = aSortOrder - bSortOrder;
      if (sortOrderDelta !== 0) return sortOrderDelta;

      const pomoDelta = (b.pomoCount ?? 0) - (a.pomoCount ?? 0);
      if (pomoDelta !== 0) return pomoDelta;

      return (a.name || "").localeCompare(b.name || "");
    });
  }),
);

const findTasks = computed(() => {
  return new Map(tasks?.value?.map((item) => [item.id, item]));
});

const activeTasks = computed(() => {
  return (tasks.value || []).filter(
    (task) =>
      task.active !== 0 &&
      !(task.tags || []).includes("completed") &&
      !(task.tags || []).includes("keep"),
  );
});

const keepTasks = computed(() => {
  return (tasks.value || []).filter(
    (task) =>
      task.active !== 0 &&
      (task.tags || []).includes("keep") &&
      !(task.tags || []).includes("completed"),
  );
});

const completedTasks = computed(() => {
  return (tasks.value || []).filter(
    (task) => task.active !== 0 && (task.tags || []).includes("completed"),
  );
});

const deletedTasks = computed(() => {
  return (tasks.value || []).filter((task) => task.active === 0);
});

const taskSections = computed(() => {
  return [
    { key: "active", label: "Active", items: activeTasks.value },
    { key: "keep", label: "Keep", items: keepTasks.value },
    { key: "completed", label: "Completed", items: completedTasks.value },
    { key: "deleted", label: "Deleted", items: deletedTasks.value },
  ];
});

const taskSectionItems = computed(() => {
  return taskSections.value.map((section) => ({
    label: `${section.label} (${section.items.length})`,
    value: section.key,
  }));
});

const taskSectionMenuKey = computed(() =>
  taskSectionItems.value.map((i) => i.label).join(""),
);

const selectedTaskSection = computed(() => {
  return (
    taskSections.value.find(
      (section) => section.key === state.taskSectionKey,
    ) ||
    taskSections.value[0] || { label: "Active", items: [] }
  );
});

function getTaskMenuItems(task) {
  const isDeleted = task.active === 0;
  const tags = new Set(task.tags || []);
  const isCompleted = tags.has("completed");
  const items = [];

  if (!isDeleted && !isCompleted) {
    items.push({
      label: "Start",
      onSelect: () => {
        state.activeTask = task;
      },
    });
  }

  if (!isDeleted) {
    items.push(
      {
        label: "Edit",
        onSelect: async () => {
          state.editTaskId = task.id;
          state.editTaskName = task.name;
        },
      },
      {
        label: "Project",
        onSelect: () => {
          state.editTaskId = task.id;
          state.editTaskProjectId = task.projectId || 0;
        },
      },
      {
        label: isCompleted ? "Mark Active" : "Mark Completed",
        onSelect: async () => {
          const newTags = new Set(task.tags || []);
          if (isCompleted) {
            newTags.delete("completed");
          } else {
            newTags.add("completed");
          }
          const nextSectionKey = getTaskSectionKey({
            ...task,
            tags: Array.from(newTags),
          });
          await db.task.update(task.id, {
            tags: Array.from(newTags),
            sortOrder: getNextTaskSortOrder(nextSectionKey),
          });
          if (!isCompleted && state.activeTask?.id === task.id) {
            state.activeTask = null;
          }
        },
      },
      {
        label: tags.has("keep") ? "Unmark Keep" : "Mark Keep",
        onSelect: async () => {
          const newTags = new Set(task.tags || []);
          if (newTags.has("keep")) newTags.delete("keep");
          else newTags.add("keep");
          const nextSectionKey = getTaskSectionKey({
            ...task,
            tags: Array.from(newTags),
          });
          await db.task.update(task.id, {
            tags: Array.from(newTags),
            sortOrder: getNextTaskSortOrder(nextSectionKey),
          });
        },
      },
    );
  }

  items.push({
    label: isDeleted ? "Undelete" : "Delete",
    onSelect: async () => {
      const nextTask = {
        ...task,
        active: isDeleted ? 1 : 0,
      };
      await db.task.update(task.id, {
        active: nextTask.active,
        sortOrder: getNextTaskSortOrder(getTaskSectionKey(nextTask)),
      });
      if (!isDeleted && state.activeTask?.id === task.id) {
        state.activeTask = null;
      }
    },
  });

  return [items];
}

function canDragTask(task) {
  return (
    dragState.taskId !== null ||
    (state.taskSectionKey !== "deleted" &&
      getTaskSectionKey(task) === state.taskSectionKey)
  );
}

function onTaskDragStart(task, event) {
  if (!canDragTask(task)) {
    event.preventDefault();
    return;
  }
  dragState.taskId = task.id;
  dragState.overTaskId = null;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(task.id));
}

function onTaskDragOver(task, event) {
  if (dragState.taskId === null || dragState.taskId === task.id) return;
  if (!canDragTask(task)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  dragState.overTaskId = task.id;
}

async function onTaskDrop(targetTask) {
  if (dragState.taskId === null || dragState.taskId === targetTask.id) return;
  const sourceTask = findTasks.value.get(dragState.taskId);
  if (!sourceTask) {
    onTaskDragEnd();
    return;
  }
  if (
    getTaskSectionKey(sourceTask) !== state.taskSectionKey ||
    getTaskSectionKey(targetTask) !== state.taskSectionKey
  ) {
    onTaskDragEnd();
    return;
  }

  const sectionTasks = [...selectedTaskSection.value.items];
  const sourceIndex = sectionTasks.findIndex(
    (task) => task.id === sourceTask.id,
  );
  const targetIndex = sectionTasks.findIndex(
    (task) => task.id === targetTask.id,
  );
  if (sourceIndex < 0 || targetIndex < 0) {
    onTaskDragEnd();
    return;
  }

  const [movedTask] = sectionTasks.splice(sourceIndex, 1);
  sectionTasks.splice(targetIndex, 0, movedTask);

  await Promise.all(
    sectionTasks.map((task, index) =>
      db.task.update(task.id, { sortOrder: index + 1 }),
    ),
  );

  onTaskDragEnd();
}

function onTaskDragEnd() {
  dragState.taskId = null;
  dragState.overTaskId = null;
}

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
    const items = await db.project.toArray();
    return items.sort((a, b) => {
      const activeDelta = (b.active ?? 0) - (a.active ?? 0);
      if (activeDelta !== 0) return activeDelta;

      const pomoDelta = (b.pomoCount ?? 0) - (a.pomoCount ?? 0);
      if (pomoDelta !== 0) return pomoDelta;

      return (a.name || "").localeCompare(b.name || "");
    });
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

function getProjectMenuItems(project) {
  return [
    [
      {
        label: "Edit",
        onSelect: async () => {
          state.editProjectId = project.id;
          state.editProjectName = project.name;
        },
      },
      {
        label: "Color",
        onSelect: () => {
          state.menuProjectItem = project;
          state.showColorSelector = true;
        },
      },
      {
        label: project.active === 0 ? "Undelete" : "Delete",
        onSelect: async () => {
          await db.project.update(project.id, {
            active: project.active === 0 ? 1 : 0,
          });
        },
      },
    ],
  ];
}

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
  const classes = [];

  if (item.colorId) {
    classes.push(`bg-${item.colorId}`);
  } else {
    classes.push("dark:bg-slate-800");
  }

  if (item.active === 0) {
    classes.push("opacity-50");
  }

  return classes;
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
      <h1 class="text-2xl my-3">
        PomoCraft
        <span class="ms-2 text-sm text-slate-500 align-middle"
          >v{{ publicConfig.appVersion }}</span
        >
      </h1>

      <div class="grid grid-flow-col gap-2 auto-cols-3 justify-center">
        <div class="min-w-60">
          <UInput
            class="w-full"
            v-model="state.newTaskName"
            placeholder="Create a new task"
            @keyup.enter="createNewTask"
          />
          <UInputMenu
            :key="taskSectionMenuKey"
            class="w-full mt-2"
            v-model="state.taskSectionKey"
            :items="taskSectionItems"
            value-key="value"
          />

          <div v-for="task in selectedTaskSection.items" :key="task.id">
            <div
              class="p-2 my-2 rounded-md"
              :class="[
                state.activeTask?.id == task.id
                  ? 'dark:bg-gray-700'
                  : 'dark:bg-slate-800',
                task.active === 0 || (task.tags || []).includes('completed')
                  ? 'opacity-60'
                  : '',
                dragState.overTaskId === task.id ? 'ring-2 ring-sky-500' : '',
              ]"
              :draggable="canDragTask(task)"
              @dragstart="onTaskDragStart(task, $event)"
              @dragover="onTaskDragOver(task, $event)"
              @drop="onTaskDrop(task)"
              @dragend="onTaskDragEnd"
            >
              <div class="flex items-center">
                <UDropdownMenu
                  :items="getTaskMenuItems(task)"
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
        <div class="min-w-60">
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
                :items="getProjectMenuItems(project)"
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
