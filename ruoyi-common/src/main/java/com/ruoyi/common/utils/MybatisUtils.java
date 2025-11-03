package com.ruoyi.common.utils;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.apache.ibatis.session.SqlSessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MybatisUtils {
    private final SqlSessionFactory sqlSessionFactory;

    @Autowired
    public MybatisUtils(SqlSessionFactory sqlSessionFactory) {
        this.sqlSessionFactory = sqlSessionFactory;
    }

    public SqlSessionFactory getSqlSessionFactory() {
        return sqlSessionFactory;
    }

    /**
     * 提取中括号内的字符串
     * 例如：params[endcreateTime] -> endcreateTime
     *
     * @param input 输入字符串
     * @return 中括号内的字符串，如果没有找到则返回null
     */
    private String extractBracketContent(String input) {
        if (StringUtils.isEmpty(input)) {
            return null;
        }

        int startIndex = input.indexOf('[');
        int endIndex = input.indexOf(']');

        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            return input.substring(startIndex + 1, endIndex);
        }

        return null;
    }

    /**
     * 根据请求参数动态构建 MyBatis-Plus 的 QueryWrapper 查询条件
     * 支持的条件方法有：
     * - xxxAsc：升序排序
     * - xxxDesc：降序排序
     * - xxxIsNull：字段为null
     * - xxxEq：等于
     * - xxxNe：不等于
     * - xxxGt：大于
     * - xxxGe：大于等于
     * - xxxLt：小于
     * - xxxLe：小于等于
     * - xxxBetween：区间
     * - xxxNotBetween：不在区间
     * - xxxLike：模糊匹配
     * - xxxNotLike：不模糊匹配
     * - xxxLikeRight：右模糊
     * - xxxLikeLeft：左模糊
     * - xxxNotLikeRight：右不模糊
     * - xxxNotLikeLeft：左不模糊
     * - xxxInSql：IN 查询
     * - xxxNotInSql：NOT IN 查询
     */
    public <T> QueryWrapper<T> getQueryWrapper(Class<T> type) {
        QueryWrapper<T> queryWrapper = new QueryWrapper<>();
        Map<String, String> reqParams = ServletUtils.getParamMap(ServletUtils.getRequest());
        if (reqParams != null && reqParams.size() > 0) {
            for (Map.Entry<String, String> entry : reqParams.entrySet()) {
                if (StringUtils.equals("pageSize", entry.getKey()) || StringUtils.equals("pageNum", entry.getKey())) {
                    continue;
                }
                if (StringUtils.startsWith(entry.getKey(), "params[")) {
                    String key = extractBracketContent(entry.getKey());
                    if (StringUtils.isNotEmpty(key) && StringUtils.isNotEmpty(entry.getValue())) {
                        if (StringUtils.startsWith(key, "begin")) {
                            queryWrapper.ge(key.substring(5), entry.getValue());
                        } else if (StringUtils.startsWith(key, "end")) {
                            queryWrapper.le(key.substring(3), entry.getValue());
                        } else {
                            queryWrapper.eq(key, entry.getValue());
                        }
                    }
                    continue;
                }
                if (StringUtils.endsWith(entry.getKey(), "Asc")) {
                    queryWrapper.orderByAsc(entry.getKey().substring(0, entry.getKey().length() - 3));
                    continue;
                }
                if (StringUtils.endsWith(entry.getKey(), "Desc")) {
                    queryWrapper.orderByDesc(entry.getKey().substring(0, entry.getKey().length() - 4));
                    continue;
                }
                if (StringUtils.endsWith(entry.getKey(), "IsNull")) {
                    queryWrapper.isNull(entry.getKey().substring(0, entry.getKey().length() - 6));
                    continue;
                }
                if (StringUtils.isEmpty(entry.getValue())) {
                    continue;
                }
                if (StringUtils.endsWith(entry.getKey(), "Eq")) {
                    queryWrapper.eq(entry.getKey().substring(0, entry.getKey().length() - 2), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "Ne")) {
                    queryWrapper.ne(entry.getKey().substring(0, entry.getKey().length() - 2), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "Gt")) {
                    queryWrapper.gt(entry.getKey().substring(0, entry.getKey().length() - 2), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "Ge")) {
                    queryWrapper.ge(entry.getKey().substring(0, entry.getKey().length() - 2), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "Lt")) {
                    queryWrapper.lt(entry.getKey().substring(0, entry.getKey().length() - 2), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "Le")) {
                    queryWrapper.le(entry.getKey().substring(0, entry.getKey().length() - 2), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "Between")) {
                    queryWrapper.between(entry.getKey().substring(0, entry.getKey().length() - 7), entry.getValue().split(",")[0], entry.getValue().split(",")[1]);
                } else if (StringUtils.endsWith(entry.getKey(), "NotBetween")) {
                    queryWrapper.notBetween(entry.getKey().substring(0, entry.getKey().length() - 10), entry.getValue().split(",")[0], entry.getValue().split(",")[1]);
                } else if (StringUtils.endsWith(entry.getKey(), "Like")) {
                    queryWrapper.like(entry.getKey().substring(0, entry.getKey().length() - 4), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "NotLike")) {
                    queryWrapper.notLike(entry.getKey().substring(0, entry.getKey().length() - 7), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "LikeRight")) {
                    queryWrapper.likeRight(entry.getKey().substring(0, entry.getKey().length() - 9), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "LikeLeft")) {
                    queryWrapper.likeLeft(entry.getKey().substring(0, entry.getKey().length() - 8), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "NotLikeRight")) {
                    queryWrapper.notLikeRight(entry.getKey().substring(0, entry.getKey().length() - 12), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "NotLikeLeft")) {
                    queryWrapper.notLikeLeft(entry.getKey().substring(0, entry.getKey().length() - 11), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "In")) {
                    queryWrapper.inSql(entry.getKey().substring(0, entry.getKey().length() - 2), entry.getValue());
                } else if (StringUtils.endsWith(entry.getKey(), "NotIn")) {
                    queryWrapper.notInSql(entry.getKey().substring(0, entry.getKey().length() - 5), entry.getValue());
                } else {
                    queryWrapper.eq(entry.getKey(), entry.getValue());
                }
            }
        }

        return queryWrapper;
    }
}
