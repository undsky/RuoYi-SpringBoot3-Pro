const Service = require('egg').Service;

class SysDictDataMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/sqlite/doudou/SysDictDataMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.sqlite.get('doudou');
    }

    selectDictDataVoMapper(values, params) {
        return this.mapper('selectDictDataVo', values, params);
    }

    async selectDictDataVo(values, params) {
        return await this.db().run(this.selectDictDataVoMapper(values, params));
    }

    selectDictDataListMapper(values, params) {
        return this.mapper('selectDictDataList', values, params);
    }

    async selectDictDataList(values, params) {
        return await this.db().selects(this.selectDictDataListMapper(values, params));
    }

    selectDictDataByTypeMapper(values, params) {
        return this.mapper('selectDictDataByType', values, params);
    }

    async selectDictDataByType(values, params) {
        return await this.db().selects(this.selectDictDataByTypeMapper(values, params));
    }

    selectDictLabelMapper(values, params) {
        return this.mapper('selectDictLabel', values, params);
    }

    async selectDictLabel(values, params) {
        return await this.db().select(this.selectDictLabelMapper(values, params));
    }

    selectDictDataByIdMapper(values, params) {
        return this.mapper('selectDictDataById', values, params);
    }

    async selectDictDataById(values, params) {
        return await this.db().select(this.selectDictDataByIdMapper(values, params));
    }

    countDictDataByTypeMapper(values, params) {
        return this.mapper('countDictDataByType', values, params);
    }

    async countDictDataByType(values, params) {
        return await this.db().select(this.countDictDataByTypeMapper(values, params));
    }

    deleteDictDataByIdMapper(values, params) {
        return this.mapper('deleteDictDataById', values, params);
    }

    async deleteDictDataById(values, params) {
        return await this.db().del(this.deleteDictDataByIdMapper(values, params));
    }

    deleteDictDataByIdsMapper(values, params) {
        return this.mapper('deleteDictDataByIds', values, params);
    }

    async deleteDictDataByIds(values, params) {
        return await this.db().del(this.deleteDictDataByIdsMapper(values, params));
    }

    updateDictDataMapper(values, params) {
        return this.mapper('updateDictData', values, params);
    }

    async updateDictData(values, params) {
        return await this.db().update(this.updateDictDataMapper(values, params));
    }

    updateDictDataTypeMapper(values, params) {
        return this.mapper('updateDictDataType', values, params);
    }

    async updateDictDataType(values, params) {
        return await this.db().update(this.updateDictDataTypeMapper(values, params));
    }

    insertDictDataMapper(values, params) {
        return this.mapper('insertDictData', values, params);
    }

    async insertDictData(values, params) {
        return await this.db().insert(this.insertDictDataMapper(values, params));
    }
}

module.exports = SysDictDataMapperService;