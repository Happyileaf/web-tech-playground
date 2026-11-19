<script setup>
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <main>
    <h1>Vue Demo</h1>
    <button type="button" @click="count++">count is {{ count }}</button>
  </main>
</template>
