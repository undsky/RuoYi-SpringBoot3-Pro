const Service = require('egg').Service;

class GenTableMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/mysql/doudou/GenTableMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.mysql.get('doudou');
    }

    selectGenTableVoMapper(values, params) {
        return this.mapper('selectGenTableVo', values, params);
    }

    async selectGenTableVo(values, params) {
        return await this.db().run(this.selectGenTableVoMapper(values, params));
    }

    selectGenTableListMapper(values, params) {
        return this.mapper('selectGenTableList', values, params);
    }

    async selectGenTableList(values, params) {
        return await this.db().selects(this.selectGenTableListMapper(values, params));
    }

    selectDbTableListMapper(values, params) {
        return this.mapper('selectDbTableList', values, params);
    }

    async selectDbTableList(values, params) {
        return await this.db().selects(this.selectDbTableListMapper(values, params));
    }

    selectDbTableListByNamesMapper(values, params) {
        return this.mapper('selectDbTableListByNames', values, params);
    }

    async selectDbTableListByNames(values, params) {
        return await this.db().selects(this.selectDbTableListByNamesMapper(values, params));
    }

    selectTableByNameMapper(values, params) {
        return this.mapper('selectTableByName', values, params);
    }

    async selectTableByName(values, params) {
        return await this.db().select(this.selectTableByNameMapper(values, params));
    }

    selectGenTableByIdMapper(values, params) {
        return this.mapper('selectGenTableById', values, params);
    }

    async selectGenTableById(values, params) {
        return await this.db().select(this.selectGenTableByIdMapper(values, params));
    }

    selectGenTableByNameMapper(values, params) {
        return this.mapper('selectGenTableByName', values, params);
    }

    async selectGenTableByName(values, params) {
        return await this.db().select(this.selectGenTableByNameMapper(values, params));
    }

    selectGenTableAllMapper(values, params) {
        return this.mapper('selectGenTableAll', values, params);
    }

    async selectGenTableAll(values, params) {
        return await this.db().selects(this.selectGenTableAllMapper(values, params));
    }

    insertGenTableMapper(values, params) {
        return this.mapper('insertGenTable', values, params);
    }

    async insertGenTable(values, params) {
        return await this.db().insert(this.insertGenTableMapper(values, params));
    }

    createTableMapper(values, params) {
        return this.mapper('createTable', values, params);
    }

    async createTable(values, params) {
        return await this.db().update(this.createTableMapper(values, params));
    }

    updateGenTableMapper(values, params) {
        return this.mapper('updateGenTable', values, params);
    }

    async updateGenTable(values, params) {
        return await this.db().update(this.updateGenTableMapper(values, params));
    }

    deleteGenTableByIdsMapper(values, params) {
        return this.mapper('deleteGenTableByIds', values, params);
    }

    async deleteGenTableByIds(values, params) {
        return await this.db().del(this.deleteGenTableByIdsMapper(values, params));
    }
}

module.exports = GenTableMapperService;