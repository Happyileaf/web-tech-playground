<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  strategy: {
    type: String,
    required: true,
    validator: (value) => ["index", "id"].includes(value),
  },
});

const emit = defineEmits(["lifecycle", "remove"]);

// 组件本地状态：列表变动时是否保留，完全取决于 v-for 的 key 策略
const markerText = ref("");
const localCount = ref(0);

onMounted(() => {
  emit("lifecycle", props.strategy, "mounted");
});

onBeforeUnmount(() => {
  emit("lifecycle", props.strategy, "unmounted");
});
</script>

<template>
  <li
    class="list-item"
    :data-strategy="strategy"
    :data-item-id="item.id"
  >
    <div class="item-header">
      <span class="item-index">#{{ index }}</span>
      <span class="item-id">id: {{ item.id }}</span>
      <span class="item-name">{{ item.name }}</span>
      <button
        type="button"
        class="btn btn-danger btn-small"
        @click="emit('remove', item.id)"
      >
        删除
      </button>
    </div>
    <div class="item-local-state">
      <label class="state-field">
        <span class="state-label">本地输入：</span>
        <input
          v-model="markerText"
          type="text"
          placeholder="输入标记文本，观察状态归属"
        />
      </label>
      <button type="button" class="btn btn-small" @click="localCount += 1">
        本地计数：{{ localCount }}
      </button>
    </div>
  </li>
</template>
