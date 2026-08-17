const Service = require('egg').Service;

class SysDictTypeMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/sqlite/doudou/SysDictTypeMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.sqlite.get('doudou');
    }

    selectDictTypeVoMapper(values, params) {
        return this.mapper('selectDictTypeVo', values, params);
    }

    async selectDictTypeVo(values, params) {
        return await this.db().run(this.selectDictTypeVoMapper(values, params));
    }

    selectDictTypeListMapper(values, params) {
        return this.mapper('selectDictTypeList', values, params);
    }

    async selectDictTypeList(values, params) {
        return await this.db().selects(this.selectDictTypeListMapper(values, params));
    }

    selectDictTypeAllMapper(values, params) {
        return this.mapper('selectDictTypeAll', values, params);
    }

    async selectDictTypeAll(values, params) {
        return await this.db().selects(this.selectDictTypeAllMapper(values, params));
    }

    selectDictTypeByIdMapper(values, params) {
        return this.mapper('selectDictTypeById', values, params);
    }

    async selectDictTypeById(values, params) {
        return await this.db().select(this.selectDictTypeByIdMapper(values, params));
    }

    selectDictTypeByTypeMapper(values, params) {
        return this.mapper('selectDictTypeByType', values, params);
    }

    async selectDictTypeByType(values, params) {
        return await this.db().select(this.selectDictTypeByTypeMapper(values, params));
    }

    checkDictTypeUniqueMapper(values, params) {
        return this.mapper('checkDictTypeUnique', values, params);
    }

    async checkDictTypeUnique(values, params) {
        return await this.db().select(this.checkDictTypeUniqueMapper(values, params));
    }

    deleteDictTypeByIdMapper(values, params) {
        return this.mapper('deleteDictTypeById', values, params);
    }

    async deleteDictTypeById(values, params) {
        return await this.db().del(this.deleteDictTypeByIdMapper(values, params));
    }

    deleteDictTypeByIdsMapper(values, params) {
        return this.mapper('deleteDictTypeByIds', values, params);
    }

    async deleteDictTypeByIds(values, params) {
        return await this.db().del(this.deleteDictTypeByIdsMapper(values, params));
    }

    updateDictTypeMapper(values, params) {
        return this.mapper('updateDictType', values, params);
    }

    async updateDictType(values, params) {
        return await this.db().update(this.updateDictTypeMapper(values, params));
    }

    insertDictTypeMapper(values, params) {
        return this.mapper('insertDictType', values, params);
    }

    async insertDictType(values, params) {
        return await this.db().insert(this.insertDictTypeMapper(values, params));
    }
}

module.exports = SysDictTypeMapperService;