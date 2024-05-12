<script setup>
defineProps(['title'])
</script>

<template>
  <div class="flex w-60 py-4 px-8 bg-slate-100 rounded-md">
    <div class="flex-1  justify-center">
      <div class="text-center text-5xl font-medium">25:00</div>
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
        <UIcon name="i-heroicons-play-circle" class="size-8" />
      </UButton>
    </div>
  </div>
</template>