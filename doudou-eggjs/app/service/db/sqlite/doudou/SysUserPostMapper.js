const Service = require('egg').Service;

class SysUserPostMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/sqlite/doudou/SysUserPostMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.sqlite.get('doudou');
    }

    deleteUserPostByUserIdMapper(values, params) {
        return this.mapper('deleteUserPostByUserId', values, params);
    }

    async deleteUserPostByUserId(values, params) {
        return await this.db().del(this.deleteUserPostByUserIdMapper(values, params));
    }

    countUserPostByIdMapper(values, params) {
        return this.mapper('countUserPostById', values, params);
    }

    async countUserPostById(values, params) {
        return await this.db().select(this.countUserPostByIdMapper(values, params));
    }

    deleteUserPostMapper(values, params) {
        return this.mapper('deleteUserPost', values, params);
    }

    async deleteUserPost(values, params) {
        return await this.db().del(this.deleteUserPostMapper(values, params));
    }

    batchUserPostMapper(values, params) {
        return this.mapper('batchUserPost', values, params);
    }

    async batchUserPost(values, params) {
        return await this.db().insert(this.batchUserPostMapper(values, params));
    }
}

module.exports = SysUserPostMapperService;