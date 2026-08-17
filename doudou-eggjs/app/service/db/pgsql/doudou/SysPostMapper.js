const Service = require('egg').Service;

class SysPostMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/pgsql/doudou/SysPostMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.pgsql.get('doudou');
    }

    selectPostVoMapper(values, params) {
        return this.mapper('selectPostVo', values, params);
    }

    async selectPostVo(values, params) {
        return await this.db().run(this.selectPostVoMapper(values, params));
    }

    selectPostListMapper(values, params) {
        return this.mapper('selectPostList', values, params);
    }

    async selectPostList(values, params) {
        return await this.db().selects(this.selectPostListMapper(values, params));
    }

    selectPostAllMapper(values, params) {
        return this.mapper('selectPostAll', values, params);
    }

    async selectPostAll(values, params) {
        return await this.db().selects(this.selectPostAllMapper(values, params));
    }

    selectPostByIdMapper(values, params) {
        return this.mapper('selectPostById', values, params);
    }

    async selectPostById(values, params) {
        return await this.db().select(this.selectPostByIdMapper(values, params));
    }

    selectPostListByUserIdMapper(values, params) {
        return this.mapper('selectPostListByUserId', values, params);
    }

    async selectPostListByUserId(values, params) {
        return await this.db().selects(this.selectPostListByUserIdMapper(values, params));
    }

    selectPostsByUserNameMapper(values, params) {
        return this.mapper('selectPostsByUserName', values, params);
    }

    async selectPostsByUserName(values, params) {
        return await this.db().selects(this.selectPostsByUserNameMapper(values, params));
    }

    checkPostNameUniqueMapper(values, params) {
        return this.mapper('checkPostNameUnique', values, params);
    }

    async checkPostNameUnique(values, params) {
        return await this.db().select(this.checkPostNameUniqueMapper(values, params));
    }

    checkPostCodeUniqueMapper(values, params) {
        return this.mapper('checkPostCodeUnique', values, params);
    }

    async checkPostCodeUnique(values, params) {
        return await this.db().select(this.checkPostCodeUniqueMapper(values, params));
    }

    updatePostMapper(values, params) {
        return this.mapper('updatePost', values, params);
    }

    async updatePost(values, params) {
        return await this.db().update(this.updatePostMapper(values, params));
    }

    insertPostMapper(values, params) {
        return this.mapper('insertPost', values, params);
    }

    async insertPost(values, params) {
        return await this.db().insert(this.insertPostMapper(values, params));
    }

    deletePostByIdMapper(values, params) {
        return this.mapper('deletePostById', values, params);
    }

    async deletePostById(values, params) {
        return await this.db().del(this.deletePostByIdMapper(values, params));
    }

    deletePostByIdsMapper(values, params) {
        return this.mapper('deletePostByIds', values, params);
    }

    async deletePostByIds(values, params) {
        return await this.db().del(this.deletePostByIdsMapper(values, params));
    }
}

module.exports = SysPostMapperService;