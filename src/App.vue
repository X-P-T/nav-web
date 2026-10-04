<template>
  <el-container class="app-layout">
    <!-- 顶部导航栏 -->
    <el-header class="app-header">
      <div class="logo-area">
        <el-icon :size="24" color="#409EFF">
          <CollectionTag />
        </el-icon>
        <span class="logo-title">Personal Navigation</span>
      </div>

      <!-- 快捷搜索框 -->
      <div class="search-box">
        <el-input v-model="searchKeyword" placeholder="搜索已收藏的网址或描述..." clearable :prefix-icon="Search" />
      </div>

      <!-- 用户状态/登录按钮 -->
      <div class="user-area">
        <template v-if="userStore.token">
          <!-- 动态角色标签 -->
          <el-tag :type="userStore.isSuperAdmin ? 'danger' : (userStore.isTeacher ? 'warning' : 'info')">
            {{ userStore.isSuperAdmin ? '超级管理员' : (userStore.isTeacher ? '教师' : '学生') }}
            - {{ userStore.userInfo.nickname || userStore.userInfo.username }}
          </el-tag>

          <!-- 【新增/编辑按钮】：仅教师或超级管理员可见 -->
          <template v-if="userStore.canCreate">
            <el-button type="primary" size="small" @click="showCategoryDialog = true">新增分类</el-button>
            <el-button type="success" size="small" @click="showSiteDialog = true">新增网址</el-button>
          </template>

          <!-- 【B端后台看板入口】：仅超级管理员可见 -->
          <el-button v-if="userStore.isSuperAdmin" type="warning" plain size="small" @click="openAdminDashboard">
            <el-icon>
              <DataAnalysis />
            </el-icon> 后台看板
          </el-button>

          <el-button type="danger" link size="small" @click="userStore.logout">退出</el-button>
        </template>
        <template v-else>
          <el-button type="primary" size="small" @click="showAuthDialog = true">登录 / 注册</el-button>
        </template>
      </div>
    </el-header>

    <!-- 主体区域：左侧分类 + 右侧书签列表 -->
    <el-container class="main-body">
      <!-- 侧边栏菜单 -->
      <el-aside width="200px" class="aside-menu">
        <el-scrollbar>
          <el-menu :default-active="activeCategory" class="menu-list">
            <el-menu-item v-for="cat in filteredCategories" :key="cat.id" :index="String(cat.id)"
              @click="scrollToCategory(cat.id)">
              <el-icon>
                <Folder />
              </el-icon>
              <span>{{ cat.name }}</span>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <!-- 右侧书签卡片区 -->
      <el-main class="content-area">
        <el-scrollbar>
          <div v-if="filteredCategories.length === 0" class="empty-tip">
            <el-empty description="暂无相关书签数据" />
          </div>

          <div v-for="category in filteredCategories" :key="category.id" :id="'category-' + category.id"
            class="category-section">
            <div class="category-header">
              <h3 class="category-title">
                <el-icon>
                  <FolderOpened />
                </el-icon> {{ category.name }}
              </h3>
              <el-popconfirm v-if="canManageCategory(category)" title="确认删除该分类及其下所有关联项？"
                @confirm="handleDeleteCategory(category.id)">
                <template #reference>
                  <el-button type="danger" link size="small">删除分类</el-button>
                </template>
              </el-popconfirm>
            </div>

            <!-- 书签网格卡片布局 -->
            <el-row :gutter="16">
              <el-col v-for="site in category.sites" :key="site.id" :xs="24" :sm="12" :md="8" :lg="6" class="card-col">
                <SiteCard :site="site" :is-owner="userStore.token && site.userId === userStore.userInfo.userId"
                  @refresh="fetchNavTree" />
              </el-col>
            </el-row>
          </div>
        </el-scrollbar>
      </el-main>
    </el-container>

    <!-- 弹窗组件：登录/注册 -->
    <el-dialog v-model="showAuthDialog" title="账号登录 / 注册" width="380px">
      <el-tabs v-model="authTab">
        <el-tab-pane label="登录" name="login">
          <el-form :model="authForm" label-width="70px">
            <el-form-item label="账号"><el-input v-model="authForm.username" /></el-form-item>
            <el-form-item label="密码"><el-input v-model="authForm.password" type="password" /></el-form-item>
            <el-button type="primary" class="full-btn" @click="handleLogin">登 录</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="authForm" label-width="70px">
            <el-form-item label="账号"><el-input v-model="authForm.username" /></el-form-item>
            <el-form-item label="密码"><el-input v-model="authForm.password" type="password" /></el-form-item>
            <el-form-item label="昵称"><el-input v-model="authForm.nickname" /></el-form-item>
            <el-button type="success" class="full-btn" @click="handleRegister">注 册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 弹窗组件：新增分类 -->
    <el-dialog v-model="showCategoryDialog" title="新增分类" width="400px">
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="分类名称"><el-input v-model="categoryForm.name" /></el-form-item>
        <el-form-item label="排序值"><el-input-number v-model="categoryForm.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddCategory">提交保存</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗组件：新增网址 -->
    <el-dialog v-model="showSiteDialog" title="新增网址书签" width="450px">
      <el-form :model="siteForm" label-width="80px">
        <el-form-item label="所属分类">
          <el-select v-model="siteForm.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="网站标题"><el-input v-model="siteForm.title" /></el-form-item>
        <el-form-item label="网站链接"><el-input v-model="siteForm.url" placeholder="https://" /></el-form-item>
        <el-form-item label="图标 URL"><el-input v-model="siteForm.iconUrl" placeholder="可空" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="siteForm.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSiteDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddSite">提交保存</el-button>
      </template>
    </el-dialog>

  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CollectionTag, Search, User, Folder, FolderOpened } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getNavTreeApi, addCategoryApi, deleteCategoryApi, addSiteApi } from '@/api'
import SiteCard from '@/components/SiteCard.vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

// 核心数据
const categories = ref([])
const searchKeyword = ref('')
const activeCategory = ref('')

// 弹窗状态
const showAuthDialog = ref(false)
const authTab = ref('login')
const showCategoryDialog = ref(false)
const showSiteDialog = ref(false)

// 表单数据
const authForm = ref({ username: '', password: '', nickname: '' })
const categoryForm = ref({ name: '', sortOrder: 0 })
const siteForm = ref({ categoryId: null, title: '', url: '', iconUrl: '', description: '' })

// 初始化查询数据
const fetchNavTree = async () => {
  const res = await getNavTreeApi()
  categories.value = res || []
  if (categories.value.length > 0 && !activeCategory.value) {
    activeCategory.value = String(categories.value[0].id)
  }
}

// 搜索过滤计算属性
const filteredCategories = computed(() => {
  if (!searchKeyword.value.trim()) return categories.value
  const kw = searchKeyword.value.toLowerCase()

  return categories.value.map(cat => {
    const matchedSites = cat.sites.filter(
      s => s.title.toLowerCase().includes(kw) || (s.description && s.description.toLowerCase().includes(kw))
    )
    if (matchedSites.length > 0 || cat.name.toLowerCase().includes(kw)) {
      return { ...cat, sites: matchedSites }
    }
    return null
  }).filter(Boolean)
})

// 锚点平滑滚动
const scrollToCategory = (catId) => {
  activeCategory.value = String(catId)
  const el = document.getElementById('category-' + catId)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

// 业务交互
const handleLogin = async () => {
  await userStore.login(authForm.value)
  showAuthDialog.value = false
  fetchNavTree()
}

const handleRegister = async () => {
  await userStore.register(authForm.value)
  authTab.value = 'login'
}

const handleAddCategory = async () => {
  if (!categoryForm.value.name) return ElMessage.warning('请输入分类名称')
  await addCategoryApi(categoryForm.value)
  ElMessage.success('新增分类成功')
  showCategoryDialog.value = false
  categoryForm.value = { name: '', sortOrder: 0 }
  fetchNavTree()
}

const handleDeleteCategory = async (id) => {
  await deleteCategoryApi(id)
  ElMessage.success('分类已删除')
  fetchNavTree()
}

const handleAddSite = async () => {
  if (!siteForm.value.categoryId || !siteForm.value.title || !siteForm.value.url) {
    return ElMessage.warning('分类、标题和链接为必填项')
  }
  await addSiteApi(siteForm.value)
  ElMessage.success('新增网址成功')
  showSiteDialog.value = false
  siteForm.value = { categoryId: null, title: '', url: '', iconUrl: '', description: '' }
  fetchNavTree()
}

// 在组件中判断是否拥有管理权限
const hasManagePermission = computed(() => {
  if (!userStore.token) return false
  // 如果是管理员，或者是数据的真正拥有者，则显示管理/删除按钮
  return userStore.userInfo.role === 'ADMIN' || props.site.userId === userStore.userInfo.userId
})

const canManageCategory = (category) => {
  if (!userStore.token) return false
  return userStore.userInfo.role === 'ADMIN' || category.userId === userStore.userInfo.userId
}

const openAdminDashboard = () => {
  ElMessage.info('B 端后台看板功能正在开发中，敬请期待！')
  // 后续搭建完看板页面/路由后，这里可以改为：
  // router.push('/admin/dashboard')
}

onMounted(() => {
  fetchNavTree()
})
</script>

<style>
/* 全局基础样式清空 */
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f5f7fa;
}

.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.search-box {
  width: 360px;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-body {
  flex: 1;
  overflow: hidden;
}

.aside-menu {
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
}

.menu-list {
  border-right: none;
}

.content-area {
  padding: 20px;
}

.category-section {
  margin-bottom: 24px;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.category-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-col {
  margin-bottom: 16px;
}

.full-btn {
  width: 100%;
  margin-top: 10px;
}

.user-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>