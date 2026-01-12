package com.ruoyi.common.utils.ai;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;

/**
 * N8n Webhook 工具类
 */
public class N8n {

    /**
     * 通用 Webhook 调用接口
     *
     * @param baseUrl   n8n 服务地址 (如: https://n8n.example.com)
     * @param webhookId Webhook ID
     * @param token     认证 Token (可选，如果配置了则添加到请求头 n-token)
     * @param payload   请求体 (JSON 对象)
     * @return 响应内容 (文本)
     */
    public static String webhook(String baseUrl, String webhookId, String token, JSONObject payload) {
        // 构建请求 URL
        String url = baseUrl + "/webhook/" + webhookId;

        // 构建请求
        HttpRequest request = HttpRequest.post(url)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .body(JSONUtil.toJsonStr(payload));

        // 如果配置了 token，添加到请求头
        if (StrUtil.isNotBlank(token)) {
            request.header("n-token", token);
        }

        // 发送请求
        try (HttpResponse response = request.execute()) {
            if (!response.isOk()) {
                throw new RuntimeException("请求失败: " + response.getStatus() + " " + response.body());
            }
            return response.body();
        }
    }
}
