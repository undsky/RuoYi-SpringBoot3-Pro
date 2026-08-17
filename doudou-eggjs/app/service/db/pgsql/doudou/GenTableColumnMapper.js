const Service = require('egg').Service;

class GenTableColumnMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/pgsql/doudou/GenTableColumnMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.pgsql.get('doudou');
    }

    selectGenTableColumnVoMapper(values, params) {
        return this.mapper('selectGenTableColumnVo', values, params);
    }

    async selectGenTableColumnVo(values, params) {
        return await this.db().run(this.selectGenTableColumnVoMapper(values, params));
    }

    selectGenTableColumnListByTableIdMapper(values, params) {
        return this.mapper('selectGenTableColumnListByTableId', values, params);
    }

    async selectGenTableColumnListByTableId(values, params) {
        return await this.db().selects(this.selectGenTableColumnListByTableIdMapper(values, params));
    }

    selectDbTableColumnsByNameMapper(values, params) {
        return this.mapper('selectDbTableColumnsByName', values, params);
    }

    async selectDbTableColumnsByName(values, params) {
        return await this.db().selects(this.selectDbTableColumnsByNameMapper(values, params));
    }

    insertGenTableColumnMapper(values, params) {
        return this.mapper('insertGenTableColumn', values, params);
    }

    async insertGenTableColumn(values, params) {
        return await this.db().insert(this.insertGenTableColumnMapper(values, params));
    }

    updateGenTableColumnMapper(values, params) {
        return this.mapper('updateGenTableColumn', values, params);
    }

    async updateGenTableColumn(values, params) {
        return await this.db().update(this.updateGenTableColumnMapper(values, params));
    }

    deleteGenTableColumnByIdsMapper(values, params) {
        return this.mapper('deleteGenTableColumnByIds', values, params);
    }

    async deleteGenTableColumnByIds(values, params) {
        return await this.db().del(this.deleteGenTableColumnByIdsMapper(values, params));
    }

    deleteGenTableColumnsMapper(values, params) {
        return this.mapper('deleteGenTableColumns', values, params);
    }

    async deleteGenTableColumns(values, params) {
        return await this.db().del(this.deleteGenTableColumnsMapper(values, params));
    }
}

module.exports = GenTableColumnMapperService;