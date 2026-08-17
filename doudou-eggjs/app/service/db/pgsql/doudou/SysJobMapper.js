const Service = require('egg').Service;

class SysJobMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/pgsql/doudou/SysJobMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.pgsql.get('doudou');
    }

    selectJobVoMapper(values, params) {
        return this.mapper('selectJobVo', values, params);
    }

    async selectJobVo(values, params) {
        return await this.db().run(this.selectJobVoMapper(values, params));
    }

    selectJobListMapper(values, params) {
        return this.mapper('selectJobList', values, params);
    }

    async selectJobList(values, params) {
        return await this.db().selects(this.selectJobListMapper(values, params));
    }

    selectJobAllMapper(values, params) {
        return this.mapper('selectJobAll', values, params);
    }

    async selectJobAll(values, params) {
        return await this.db().selects(this.selectJobAllMapper(values, params));
    }

    selectJobByIdMapper(values, params) {
        return this.mapper('selectJobById', values, params);
    }

    async selectJobById(values, params) {
        return await this.db().select(this.selectJobByIdMapper(values, params));
    }

    deleteJobByIdMapper(values, params) {
        return this.mapper('deleteJobById', values, params);
    }

    async deleteJobById(values, params) {
        return await this.db().del(this.deleteJobByIdMapper(values, params));
    }

    deleteJobByIdsMapper(values, params) {
        return this.mapper('deleteJobByIds', values, params);
    }

    async deleteJobByIds(values, params) {
        return await this.db().del(this.deleteJobByIdsMapper(values, params));
    }

    updateJobMapper(values, params) {
        return this.mapper('updateJob', values, params);
    }

    async updateJob(values, params) {
        return await this.db().update(this.updateJobMapper(values, params));
    }

    insertJobMapper(values, params) {
        return this.mapper('insertJob', values, params);
    }

    async insertJob(values, params) {
        return await this.db().insert(this.insertJobMapper(values, params));
    }
}

module.exports = SysJobMapperService;