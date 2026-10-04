<template>
  <el-card class="site-card" shadow="hover" @click="handleSiteClick">
    <div class="site-header">
      <el-avatar :size="32" :src="site.icon || defaultIcon" class="site-icon" />
      <div class="site-title-area">
        <span class="site-title">{{ site.title }}</span>
        <span class="site-clicks"><el-icon>
            <View />
          </el-icon> {{ clickCount }}</span>
      </div>

      <!-- 操作区域：仅超级管理员 或 创作者本人 可见 -->
      <div v-if="hasManagePermission" class="card-actions" @click.stop>
        <!-- 编辑按钮 -->
        <el-button type="primary" link :icon="Edit" @click.stop="handleEdit" />

        <!-- 删除确认按钮 -->
        <el-popconfirm title="确认删除该网址吗？" @confirm="handleDelete">
          <template #reference>
            <el-button type="danger" link :icon="Delete" />
          </template>
        </el-popconfirm>
      </div>
    </div>
    <p class="site-desc">{{ site.description || '暂无描述' }}</p>
    </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Edit, Delete, View } from '@element-plus/icons-vue'
import { clickSiteApi, deleteSiteApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const props = defineProps({
  site: { type: Object, required: true }
})

const emit = defineEmits(['refresh', 'edit'])
const userStore = useUserStore()
const clickCount = ref(props.site.clickCount || 0)
const defaultIcon = 'https://element-plus.org/images/element-plus-logo.svg'

// 核心权限计算：是否为 SUPER_ADMIN 或 资源拥有者
const hasManagePermission = computed(() => {
  if (!userStore.token) return false
  return userStore.userInfo.role === 'SUPER_ADMIN' || props.site.userId === userStore.userInfo.userId
})

const handleSiteClick = () => {
  clickCount.value += 1
  clickSiteApi(props.site.id).catch(() => { })
  window.open(props.site.url, '_blank')
}

const handleEdit = () => {
  emit('edit', props.site)
}

const handleDelete = async () => {
  await deleteSiteApi(props.site.id)
  ElMessage.success('删除网址成功')
  emit('refresh')
}
</script>