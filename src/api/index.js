import request from '@/utils/request'

// 1. 用户认证模块
export const registerApi = (data) => request({ url: '/api/auth/register', method: 'post', data })
export const loginApi = (data) => request({ url: '/api/auth/login', method: 'post', data })
export const logoutApi = () => request({ url: '/api/auth/logout', method: 'post' })
export const getUserInfoApi = () => request({ url: '/api/auth/info', method: 'get' })

// 2. 导航与书签模块
export const getNavTreeApi = (userId) => request({ url: '/api/nav/tree', method: 'get', params: { userId } })
export const addCategoryApi = (data) => request({ url: '/api/nav/category', method: 'post', data })
export const deleteCategoryApi = (id) => request({ url: `/api/nav/category/${id}`, method: 'delete' })
export const addSiteApi = (data) => request({ url: '/api/nav/site', method: 'post', data })
export const deleteSiteApi = (id) => request({ url: `/api/nav/site/${id}`, method: 'delete' })
export const clickSiteApi = (id) => request({ url: `/api/nav/site/click/${id}`, method: 'post' })
export function updateSiteApi(data) {
    return request({
        url: '/nav/site',
        method: 'put',
        data
    })
}
export function updateCategoryApi(data) {
    return request({
        url: '/nav/category',
        method: 'put',
        data
    })
}