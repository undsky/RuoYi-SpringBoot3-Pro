const Service = require('egg').Service;

class SysNoticeMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/sqlite/doudou/SysNoticeMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.sqlite.get('doudou');
    }

    selectNoticeVoMapper(values, params) {
        return this.mapper('selectNoticeVo', values, params);
    }

    async selectNoticeVo(values, params) {
        return await this.db().run(this.selectNoticeVoMapper(values, params));
    }

    selectNoticeByIdMapper(values, params) {
        return this.mapper('selectNoticeById', values, params);
    }

    async selectNoticeById(values, params) {
        return await this.db().select(this.selectNoticeByIdMapper(values, params));
    }

    selectNoticeListMapper(values, params) {
        return this.mapper('selectNoticeList', values, params);
    }

    async selectNoticeList(values, params) {
        return await this.db().selects(this.selectNoticeListMapper(values, params));
    }

    insertNoticeMapper(values, params) {
        return this.mapper('insertNotice', values, params);
    }

    async insertNotice(values, params) {
        return await this.db().insert(this.insertNoticeMapper(values, params));
    }

    updateNoticeMapper(values, params) {
        return this.mapper('updateNotice', values, params);
    }

    async updateNotice(values, params) {
        return await this.db().update(this.updateNoticeMapper(values, params));
    }

    deleteNoticeByIdMapper(values, params) {
        return this.mapper('deleteNoticeById', values, params);
    }

    async deleteNoticeById(values, params) {
        return await this.db().del(this.deleteNoticeByIdMapper(values, params));
    }

    deleteNoticeByIdsMapper(values, params) {
        return this.mapper('deleteNoticeByIds', values, params);
    }

    async deleteNoticeByIds(values, params) {
        return await this.db().del(this.deleteNoticeByIdsMapper(values, params));
    }
}

module.exports = SysNoticeMapperService;