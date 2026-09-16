import JSEncrypt from 'jsencrypt/bin/jsencrypt.min'

// 前端 RSA 公钥加密工具
// 注意：私钥必须且只能保存在受信任的后端服务中，前端严禁存放私钥

const publicKey =
  'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKoR8mX0rGKLqzcWmOzbfj64K8ZIgOdH\n' +
  'nzkXSOVOZbFu/TJhZ7rFAN+eaGkl3C4buccQd/EjEsj9ir7ijT7h96MCAwEAAQ=='

// RSA 公钥加密
export function encrypt(txt) {
  if (!txt) return ''
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  return encryptor.encrypt(txt) || ''
}

