<script setup>
import { onMounted } from "vue";
import ListItem from "./components/ListItem.vue";
import { useExperiment } from "./composables/useExperiment.js";

const {
  items,
  logs,
  resetVersion,
  reportLifecycle,
  recordInitialRender,
  insertAtHead,
  insertAtTail,
  insertAtRandom,
  removeItem,
  reverseItems,
  shuffleItems,
  reset,
  clearLogs,
} = useExperiment();

onMounted(() => {
  recordInitialRender();
});

function handleLifecycle(strategy, type) {
  reportLifecycle(strategy, type);
}
</script>

<template>
  <main class="page">
    <header class="page-header">
      <h1>Vue 3 列表渲染 Key 差异实验</h1>
      <p class="subtitle">
        同一份数据、同一组操作，对比 <code>:key=&quot;index&quot;</code> 与
        <code>:key=&quot;item.id&quot;</code> 在 DOM 复用与组件本地状态保留上的差异。
      </p>
    </header>

    <section class="control-panel" aria-label="列表操作">
      <button type="button" class="btn" @click="insertAtHead">头部插入</button>
      <button type="button" class="btn" @click="insertAtTail">尾部插入</button>
      <button type="button" class="btn" @click="insertAtRandom">随机位置插入</button>
      <button type="button" class="btn" @click="reverseItems">反转顺序</button>
      <button type="button" class="btn" @click="shuffleItems">随机洗牌</button>
      <button type="button" class="btn btn-warn" @click="reset">重置</button>
    </section>

    <section class="experiment-grid">
      <article class="experiment-column">
        <div class="column-header">
          <h2>左区：索引作 key</h2>
          <span class="key-badge key-badge-index">:key=&quot;index&quot;</span>
        </div>
        <ul :key="`index-${resetVersion}`" class="item-list">
          <ListItem
            v-for="(item, index) in items"
            :key="index"
            :item="item"
            :index="index"
            strategy="index"
            @lifecycle="handleLifecycle"
            @remove="removeItem"
          />
        </ul>
      </article>

      <article class="experiment-column">
        <div class="column-header">
          <h2>右区：稳定 id 作 key</h2>
          <span class="key-badge key-badge-id">:key=&quot;item.id&quot;</span>
        </div>
        <ul :key="`id-${resetVersion}`" class="item-list">
          <ListItem
            v-for="(item, index) in items"
            :key="item.id"
            :item="item"
            :index="index"
            strategy="id"
            @lifecycle="handleLifecycle"
            @remove="removeItem"
          />
        </ul>
      </article>
    </section>

    <section class="log-panel" aria-label="生命周期日志">
      <div class="log-header">
        <h2>生命周期与 DOM 复用日志</h2>
        <button type="button" class="btn btn-small" @click="clearLogs">清空日志</button>
      </div>
      <p class="log-hint">
        mounted = 本次新建组件（新建 DOM）数量；unmounted = 本次卸载组件数量；累计挂载 = 该实验区历史挂载总数。
      </p>
      <ul v-if="logs.length" class="log-list">
        <li v-for="log in [...logs].reverse()" :key="log.id" class="log-entry">
          <div class="log-entry-title">
            <span class="log-seq">#{{ log.id }}</span>
            <span class="log-name">{{ log.name }}</span>
            <span class="log-time">{{ log.time }}</span>
          </div>
          <div class="log-stats">
            <div class="log-stat log-stat-index">
              <span class="log-stat-name">:key=&quot;index&quot;</span>
              <span>mounted <strong>{{ log.index.mounted }}</strong></span>
              <span>unmounted <strong>{{ log.index.unmounted }}</strong></span>
              <span>累计挂载 <strong>{{ log.index.totalMounted }}</strong></span>
            </div>
            <div class="log-stat log-stat-id">
              <span class="log-stat-name">:key=&quot;item.id&quot;</span>
              <span>mounted <strong>{{ log.id.mounted }}</strong></span>
              <span>unmounted <strong>{{ log.id.unmounted }}</strong></span>
              <span>累计挂载 <strong>{{ log.id.totalMounted }}</strong></span>
            </div>
          </div>
        </li>
      </ul>
      <p v-else class="log-empty">暂无日志，点击上方任意操作按钮开始实验。</p>
    </section>
  </main>
</template>
