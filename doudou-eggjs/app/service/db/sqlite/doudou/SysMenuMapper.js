const Service = require('egg').Service;

class SysMenuMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/sqlite/doudou/SysMenuMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.sqlite.get('doudou');
    }

    selectMenuVoMapper(values, params) {
        return this.mapper('selectMenuVo', values, params);
    }

    async selectMenuVo(values, params) {
        return await this.db().run(this.selectMenuVoMapper(values, params));
    }

    selectMenuListMapper(values, params) {
        return this.mapper('selectMenuList', values, params);
    }

    async selectMenuList(values, params) {
        return await this.db().selects(this.selectMenuListMapper(values, params));
    }

    selectMenuTreeAllMapper(values, params) {
        return this.mapper('selectMenuTreeAll', values, params);
    }

    async selectMenuTreeAll(values, params) {
        return await this.db().selects(this.selectMenuTreeAllMapper(values, params));
    }

    selectMenuListByUserIdMapper(values, params) {
        return this.mapper('selectMenuListByUserId', values, params);
    }

    async selectMenuListByUserId(values, params) {
        return await this.db().select(this.selectMenuListByUserIdMapper(values, params));
    }

    selectMenuTreeByUserIdMapper(values, params) {
        return this.mapper('selectMenuTreeByUserId', values, params);
    }

    async selectMenuTreeByUserId(values, params) {
        return await this.db().selects(this.selectMenuTreeByUserIdMapper(values, params));
    }

    selectMenuListByRoleIdMapper(values, params) {
        return this.mapper('selectMenuListByRoleId', values, params);
    }

    async selectMenuListByRoleId(values, params) {
        return await this.db().selects(this.selectMenuListByRoleIdMapper(values, params));
    }

    selectMenuPermsMapper(values, params) {
        return this.mapper('selectMenuPerms', values, params);
    }

    async selectMenuPerms(values, params) {
        return await this.db().selects(this.selectMenuPermsMapper(values, params));
    }

    selectMenuPermsByUserIdMapper(values, params) {
        return this.mapper('selectMenuPermsByUserId', values, params);
    }

    async selectMenuPermsByUserId(values, params) {
        return await this.db().selects(this.selectMenuPermsByUserIdMapper(values, params));
    }

    selectMenuPermsByRoleIdMapper(values, params) {
        return this.mapper('selectMenuPermsByRoleId', values, params);
    }

    async selectMenuPermsByRoleId(values, params) {
        return await this.db().selects(this.selectMenuPermsByRoleIdMapper(values, params));
    }

    selectMenuByIdMapper(values, params) {
        return this.mapper('selectMenuById', values, params);
    }

    async selectMenuById(values, params) {
        return await this.db().select(this.selectMenuByIdMapper(values, params));
    }

    hasChildByMenuIdMapper(values, params) {
        return this.mapper('hasChildByMenuId', values, params);
    }

    async hasChildByMenuId(values, params) {
        return await this.db().select(this.hasChildByMenuIdMapper(values, params));
    }

    checkMenuNameUniqueMapper(values, params) {
        return this.mapper('checkMenuNameUnique', values, params);
    }

    async checkMenuNameUnique(values, params) {
        return await this.db().select(this.checkMenuNameUniqueMapper(values, params));
    }

    updateMenuMapper(values, params) {
        return this.mapper('updateMenu', values, params);
    }

    async updateMenu(values, params) {
        return await this.db().update(this.updateMenuMapper(values, params));
    }

    insertMenuMapper(values, params) {
        return this.mapper('insertMenu', values, params);
    }

    async insertMenu(values, params) {
        return await this.db().insert(this.insertMenuMapper(values, params));
    }

    deleteMenuByIdMapper(values, params) {
        return this.mapper('deleteMenuById', values, params);
    }

    async deleteMenuById(values, params) {
        return await this.db().del(this.deleteMenuByIdMapper(values, params));
    }
}

module.exports = SysMenuMapperService;