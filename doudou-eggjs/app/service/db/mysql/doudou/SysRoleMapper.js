const Service = require('egg').Service;

class SysRoleMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/mysql/doudou/SysRoleMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.mysql.get('doudou');
    }

    selectRoleVoMapper(values, params) {
        return this.mapper('selectRoleVo', values, params);
    }

    async selectRoleVo(values, params) {
        return await this.db().run(this.selectRoleVoMapper(values, params));
    }

    selectRoleListMapper(values, params) {
        return this.mapper('selectRoleList', values, params);
    }

    async selectRoleList(values, params) {
        return await this.db().selects(this.selectRoleListMapper(values, params));
    }

    selectRolePermissionByUserIdMapper(values, params) {
        return this.mapper('selectRolePermissionByUserId', values, params);
    }

    async selectRolePermissionByUserId(values, params) {
        return await this.db().selects(this.selectRolePermissionByUserIdMapper(values, params));
    }

    selectRoleAllMapper(values, params) {
        return this.mapper('selectRoleAll', values, params);
    }

    async selectRoleAll(values, params) {
        return await this.db().selects(this.selectRoleAllMapper(values, params));
    }

    selectRoleListByUserIdMapper(values, params) {
        return this.mapper('selectRoleListByUserId', values, params);
    }

    async selectRoleListByUserId(values, params) {
        return await this.db().selects(this.selectRoleListByUserIdMapper(values, params));
    }

    selectRoleByIdMapper(values, params) {
        return this.mapper('selectRoleById', values, params);
    }

    async selectRoleById(values, params) {
        return await this.db().select(this.selectRoleByIdMapper(values, params));
    }

    selectRolesByUserNameMapper(values, params) {
        return this.mapper('selectRolesByUserName', values, params);
    }

    async selectRolesByUserName(values, params) {
        return await this.db().selects(this.selectRolesByUserNameMapper(values, params));
    }

    checkRoleNameUniqueMapper(values, params) {
        return this.mapper('checkRoleNameUnique', values, params);
    }

    async checkRoleNameUnique(values, params) {
        return await this.db().select(this.checkRoleNameUniqueMapper(values, params));
    }

    checkRoleKeyUniqueMapper(values, params) {
        return this.mapper('checkRoleKeyUnique', values, params);
    }

    async checkRoleKeyUnique(values, params) {
        return await this.db().select(this.checkRoleKeyUniqueMapper(values, params));
    }

    insertRoleMapper(values, params) {
        return this.mapper('insertRole', values, params);
    }

    async insertRole(values, params) {
        return await this.db().insert(this.insertRoleMapper(values, params));
    }

    updateRoleMapper(values, params) {
        return this.mapper('updateRole', values, params);
    }

    async updateRole(values, params) {
        return await this.db().update(this.updateRoleMapper(values, params));
    }

    deleteRoleByIdMapper(values, params) {
        return this.mapper('deleteRoleById', values, params);
    }

    async deleteRoleById(values, params) {
        return await this.db().del(this.deleteRoleByIdMapper(values, params));
    }

    deleteRoleByIdsMapper(values, params) {
        return this.mapper('deleteRoleByIds', values, params);
    }

    async deleteRoleByIds(values, params) {
        return await this.db().del(this.deleteRoleByIdsMapper(values, params));
    }
}

module.exports = SysRoleMapperService;