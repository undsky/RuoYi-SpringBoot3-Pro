const Service = require('egg').Service;

class SysJobLogMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/mysql/doudou/SysJobLogMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.mysql.get('doudou');
    }

    selectJobLogVoMapper(values, params) {
        return this.mapper('selectJobLogVo', values, params);
    }

    async selectJobLogVo(values, params) {
        return await this.db().run(this.selectJobLogVoMapper(values, params));
    }

    selectJobLogListMapper(values, params) {
        return this.mapper('selectJobLogList', values, params);
    }

    async selectJobLogList(values, params) {
        return await this.db().selects(this.selectJobLogListMapper(values, params));
    }

    selectJobLogAllMapper(values, params) {
        return this.mapper('selectJobLogAll', values, params);
    }

    async selectJobLogAll(values, params) {
        return await this.db().selects(this.selectJobLogAllMapper(values, params));
    }

    selectJobLogByIdMapper(values, params) {
        return this.mapper('selectJobLogById', values, params);
    }

    async selectJobLogById(values, params) {
        return await this.db().select(this.selectJobLogByIdMapper(values, params));
    }

    deleteJobLogByIdMapper(values, params) {
        return this.mapper('deleteJobLogById', values, params);
    }

    async deleteJobLogById(values, params) {
        return await this.db().del(this.deleteJobLogByIdMapper(values, params));
    }

    deleteJobLogByIdsMapper(values, params) {
        return this.mapper('deleteJobLogByIds', values, params);
    }

    async deleteJobLogByIds(values, params) {
        return await this.db().del(this.deleteJobLogByIdsMapper(values, params));
    }

    cleanJobLogMapper(values, params) {
        return this.mapper('cleanJobLog', values, params);
    }

    async cleanJobLog(values, params) {
        return await this.db().update(this.cleanJobLogMapper(values, params));
    }

    insertJobLogMapper(values, params) {
        return this.mapper('insertJobLog', values, params);
    }

    async insertJobLog(values, params) {
        return await this.db().insert(this.insertJobLogMapper(values, params));
    }
}

module.exports = SysJobLogMapperService;