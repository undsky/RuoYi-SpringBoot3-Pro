const Service = require('egg').Service;

class SysDeptMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/sqlite/doudou/SysDeptMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.sqlite.get('doudou');
    }

    selectDeptVoMapper(values, params) {
        return this.mapper('selectDeptVo', values, params);
    }

    async selectDeptVo(values, params) {
        return await this.db().run(this.selectDeptVoMapper(values, params));
    }

    selectDeptListMapper(values, params) {
        return this.mapper('selectDeptList', values, params);
    }

    async selectDeptList(values, params) {
        return await this.db().selects(this.selectDeptListMapper(values, params));
    }

    selectDeptListByRoleIdMapper(values, params) {
        return this.mapper('selectDeptListByRoleId', values, params);
    }

    async selectDeptListByRoleId(values, params) {
        return await this.db().selects(this.selectDeptListByRoleIdMapper(values, params));
    }

    selectDeptByIdMapper(values, params) {
        return this.mapper('selectDeptById', values, params);
    }

    async selectDeptById(values, params) {
        return await this.db().select(this.selectDeptByIdMapper(values, params));
    }

    checkDeptExistUserMapper(values, params) {
        return this.mapper('checkDeptExistUser', values, params);
    }

    async checkDeptExistUser(values, params) {
        return await this.db().select(this.checkDeptExistUserMapper(values, params));
    }

    hasChildByDeptIdMapper(values, params) {
        return this.mapper('hasChildByDeptId', values, params);
    }

    async hasChildByDeptId(values, params) {
        return await this.db().select(this.hasChildByDeptIdMapper(values, params));
    }

    selectChildrenDeptByIdMapper(values, params) {
        return this.mapper('selectChildrenDeptById', values, params);
    }

    async selectChildrenDeptById(values, params) {
        return await this.db().selects(this.selectChildrenDeptByIdMapper(values, params));
    }

    selectNormalChildrenDeptByIdMapper(values, params) {
        return this.mapper('selectNormalChildrenDeptById', values, params);
    }

    async selectNormalChildrenDeptById(values, params) {
        return await this.db().select(this.selectNormalChildrenDeptByIdMapper(values, params));
    }

    checkDeptNameUniqueMapper(values, params) {
        return this.mapper('checkDeptNameUnique', values, params);
    }

    async checkDeptNameUnique(values, params) {
        return await this.db().select(this.checkDeptNameUniqueMapper(values, params));
    }

    insertDeptMapper(values, params) {
        return this.mapper('insertDept', values, params);
    }

    async insertDept(values, params) {
        return await this.db().insert(this.insertDeptMapper(values, params));
    }

    updateDeptMapper(values, params) {
        return this.mapper('updateDept', values, params);
    }

    async updateDept(values, params) {
        return await this.db().update(this.updateDeptMapper(values, params));
    }

    updateDeptChildrenMapper(values, params) {
        return this.mapper('updateDeptChildren', values, params);
    }

    async updateDeptChildren(values, params) {
        return await this.db().update(this.updateDeptChildrenMapper(values, params));
    }

    updateDeptStatusNormalMapper(values, params) {
        return this.mapper('updateDeptStatusNormal', values, params);
    }

    async updateDeptStatusNormal(values, params) {
        return await this.db().update(this.updateDeptStatusNormalMapper(values, params));
    }

    deleteDeptByIdMapper(values, params) {
        return this.mapper('deleteDeptById', values, params);
    }

    async deleteDeptById(values, params) {
        return await this.db().del(this.deleteDeptByIdMapper(values, params));
    }
}

module.exports = SysDeptMapperService;