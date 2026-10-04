import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loginApi, registerApi, getUserInfoApi, logoutApi } from '@/api'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('satoken') || '')
    const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
    const isSuperAdmin = computed(() => userInfo.value.role === 'SUPER_ADMIN')
    const isTeacher = computed(() => userInfo.value.role === 'TEACHER')
    const canCreate = computed(() => ['SUPER_ADMIN', 'TEACHER'].includes(userInfo.value.role))

    // 登录
    const login = async (form) => {
        const res = await loginApi(form)
        token.value = res.tokenValue
        userInfo.value = {
            userId: res.userId,
            username: res.username,
            nickname: res.nickname,
            role: res.role
        }
        localStorage.setItem('satoken', res.tokenValue)
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        ElMessage.success('登录成功')
    }

    // 注册
    const register = async (form) => {
        await registerApi(form)
        ElMessage.success('注册成功，请登录')
    }

    // 退出登录
    const logout = async () => {
        try {
            if (token.value) await logoutApi()
        } finally {
            token.value = ''
            userInfo.value = {}
            localStorage.removeItem('satoken')
            localStorage.removeItem('userInfo')
            ElMessage.success('已退出登录')
        }
    }

    return { token, userInfo, isSuperAdmin, isTeacher, canCreate, login, register, logout }
})