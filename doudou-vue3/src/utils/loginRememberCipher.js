const STORAGE_KEY = 'doudou_login_remember_cipher'
const CIPHER_SALT = 'doudou_v3_remember_salt'

/**
 * 客户端本地混淆编码（避免在前端硬编码私钥，防止明文直接暴露在 localStorage）
 */
function encodeCredential(str) {
  if (!str) return ''
  try {
    const textBytes = new TextEncoder().encode(str)
    const saltBytes = new TextEncoder().encode(CIPHER_SALT)
    const obfuscated = new Uint8Array(textBytes.length)
    for (let i = 0; i < textBytes.length; i++) {
      obfuscated[i] = textBytes[i] ^ saltBytes[i % saltBytes.length]
    }
    let binary = ''
    for (let i = 0; i < obfuscated.length; i++) {
      binary += String.fromCharCode(obfuscated[i])
    }
    return window.btoa(binary)
  } catch {
    return ''
  }
}

/**
 * 客户端本地混淆解码
 */
function decodeCredential(encoded) {
  if (!encoded) return ''
  try {
    const binary = window.atob(encoded)
    const obfuscated = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      obfuscated[i] = binary.charCodeAt(i)
    }
    const saltBytes = new TextEncoder().encode(CIPHER_SALT)
    const textBytes = new Uint8Array(obfuscated.length)
    for (let i = 0; i < obfuscated.length; i++) {
      textBytes[i] = obfuscated[i] ^ saltBytes[i % saltBytes.length]
    }
    return new TextDecoder().decode(textBytes)
  } catch {
    return ''
  }
}

/** 读取记住的用户名与密码 */
export function readStoredLoginCredentials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { username, passwordEnc } = JSON.parse(raw)
    if (!username || !passwordEnc) return null
    const password = decodeCredential(passwordEnc)
    if (!password) return null
    return { username, password }
  } catch {
    return null
  }
}

/** 写入记住的用户名与密码 */
export function writeStoredLoginCredentials({ username, password }) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      username,
      passwordEnc: encodeCredential(password),
    }),
  )
}

/** 清理记住的登录信息 */
export function clearStoredLoginCredentials() {
  localStorage.removeItem(STORAGE_KEY)
}

