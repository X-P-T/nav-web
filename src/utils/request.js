import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: '', // 使用 vite 代理，留空即可
  timeout: 10000
})

// 请求拦截器：自动注入 Sa-Token 头
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('satoken')
    if (token) {
      config.headers['satoken'] = token
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：统一处理错误
service.interceptors.response.use(
  response => {
    const res = response.data
    // 如果返回的是后端统一捕获的错误对象（包含 code 字段）
    if (res && res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  error => {
    const errorMsg = error.response?.data?.message || error.message || '网络请求异常'
    ElMessage.error(errorMsg)
    return Promise.reject(error)
  }
)

export default service