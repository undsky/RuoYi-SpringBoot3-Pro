const Service = require('egg').Service;

class SysConfigMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/sqlite/doudou/SysConfigMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.sqlite.get('doudou');
    }

    selectConfigVoMapper(values, params) {
        return this.mapper('selectConfigVo', values, params);
    }

    async selectConfigVo(values, params) {
        return await this.db().run(this.selectConfigVoMapper(values, params));
    }

    sqlwhereSearchMapper(values, params) {
        return this.mapper('sqlwhereSearch', values, params);
    }

    async sqlwhereSearch(values, params) {
        return await this.db().run(this.sqlwhereSearchMapper(values, params));
    }

    selectConfigMapper(values, params) {
        return this.mapper('selectConfig', values, params);
    }

    async selectConfig(values, params) {
        return await this.db().select(this.selectConfigMapper(values, params));
    }

    selectConfigListMapper(values, params) {
        return this.mapper('selectConfigList', values, params);
    }

    async selectConfigList(values, params) {
        return await this.db().selects(this.selectConfigListMapper(values, params));
    }

    selectConfigByIdMapper(values, params) {
        return this.mapper('selectConfigById', values, params);
    }

    async selectConfigById(values, params) {
        return await this.db().select(this.selectConfigByIdMapper(values, params));
    }

    checkConfigKeyUniqueMapper(values, params) {
        return this.mapper('checkConfigKeyUnique', values, params);
    }

    async checkConfigKeyUnique(values, params) {
        return await this.db().select(this.checkConfigKeyUniqueMapper(values, params));
    }

    insertConfigMapper(values, params) {
        return this.mapper('insertConfig', values, params);
    }

    async insertConfig(values, params) {
        return await this.db().insert(this.insertConfigMapper(values, params));
    }

    updateConfigMapper(values, params) {
        return this.mapper('updateConfig', values, params);
    }

    async updateConfig(values, params) {
        return await this.db().update(this.updateConfigMapper(values, params));
    }

    deleteConfigByIdMapper(values, params) {
        return this.mapper('deleteConfigById', values, params);
    }

    async deleteConfigById(values, params) {
        return await this.db().del(this.deleteConfigByIdMapper(values, params));
    }

    deleteConfigByIdsMapper(values, params) {
        return this.mapper('deleteConfigByIds', values, params);
    }

    async deleteConfigByIds(values, params) {
        return await this.db().del(this.deleteConfigByIdsMapper(values, params));
    }
}

module.exports = SysConfigMapperService;