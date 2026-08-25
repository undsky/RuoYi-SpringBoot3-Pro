<template>
  <div class="turnstile-container-wrapper">
    <div ref="containerRef" class="turnstile-widget-box" />
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  siteKey: {
    type: String,
    default: () => import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
  },
  action: {
    type: String,
    default: '',
  },
  theme: {
    type: String,
    default: 'auto', // 'auto' | 'light' | 'dark'
  },
  size: {
    type: String,
    default: 'normal', // 'normal' | 'compact' | 'flexible'
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'success', 'error', 'expired'])

const containerRef = ref(null)
const widgetId = ref(null)
const isLoaded = ref(false)

/**
 * 等待 Turnstile SDK 加载就绪
 */
function waitForTurnstile(maxRetries = 40, interval = 150) {
  return new Promise((resolve, reject) => {
    let count = 0
    const check = () => {
      if (window.turnstile && typeof window.turnstile.render === 'function') {
        resolve(window.turnstile)
      } else if (count >= maxRetries) {
        reject(new Error('Turnstile SDK 加载超时，请刷新重试'))
      } else {
        count++
        setTimeout(check, interval)
      }
    }
    check()
  })
}

/**
 * 渲染 Turnstile 验证组件
 */
async function renderWidget() {
  if (!containerRef.value || !props.siteKey) return

  try {
    const turnstile = await waitForTurnstile()
    isLoaded.value = true

    // 如果之前已经渲染过，先移除
    if (widgetId.value !== null) {
      try {
        turnstile.remove(widgetId.value)
      } catch (e) {
        // 忽略移除错误
      }
      widgetId.value = null
    }

    // 清理容器子节点防重复
    containerRef.value.innerHTML = ''

    const renderOptions = {
      sitekey: props.siteKey,
      theme: props.theme,
      size: props.size,
      callback: (token) => {
        emit('update:modelValue', token)
        emit('success', token)
      },
      'expired-callback': () => {
        emit('update:modelValue', '')
        emit('expired')
      },
      'error-callback': (code) => {
        emit('update:modelValue', '')
        emit('error', code)
      },
    }

    if (props.action) {
      renderOptions.action = props.action
    }

    widgetId.value = turnstile.render(containerRef.value, renderOptions)
  } catch (err) {
    console.error('渲染 Turnstile 失败:', err)
  }
}

/**
 * 重置验证码
 */
function reset() {
  emit('update:modelValue', '')
  if (widgetId.value !== null && window.turnstile) {
    try {
      window.turnstile.reset(widgetId.value)
    } catch (e) {
      console.warn('Turnstile 重置失败，重新渲染:', e)
      renderWidget()
    }
  } else {
    renderWidget()
  }
}

/**
 * 获取当前 token
 */
function getResponse() {
  if (widgetId.value !== null && window.turnstile) {
    return window.turnstile.getResponse(widgetId.value) || ''
  }
  return ''
}

// 监听主题或 action 变化重新渲染
watch(
  () => [props.theme, props.action, props.siteKey],
  () => {
    nextTick(() => {
      renderWidget()
    })
  }
)

onMounted(() => {
  nextTick(() => {
    renderWidget()
  })
})

onBeforeUnmount(() => {
  if (widgetId.value !== null && window.turnstile) {
    try {
      window.turnstile.remove(widgetId.value)
    } catch (e) {
      // 忽略销毁异常
    }
    widgetId.value = null
  }
})

defineExpose({
  reset,
  getResponse,
  render: renderWidget,
})
</script>

<style scoped>
.turnstile-container-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 65px;
  margin: 4px 0 12px;
}

.turnstile-widget-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 65px;
  width: 100%;
}
</style>
