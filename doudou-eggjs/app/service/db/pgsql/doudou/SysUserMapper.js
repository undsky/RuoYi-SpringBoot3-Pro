const Service = require('egg').Service;

class SysUserMapperService extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('mapper/pgsql/doudou/SysUserMapper.xml', sqlid, values, params)
    }

    db() {
        return this.app.pgsql.get('doudou');
    }

    selectUserVoMapper(values, params) {
        return this.mapper('selectUserVo', values, params);
    }

    async selectUserVo(values, params) {
        return await this.db().run(this.selectUserVoMapper(values, params));
    }

    selectUserListMapper(values, params) {
        return this.mapper('selectUserList', values, params);
    }

    async selectUserList(values, params) {
        return await this.db().selects(this.selectUserListMapper(values, params));
    }

    selectAllocatedListMapper(values, params) {
        return this.mapper('selectAllocatedList', values, params);
    }

    async selectAllocatedList(values, params) {
        return await this.db().selects(this.selectAllocatedListMapper(values, params));
    }

    selectUnallocatedListMapper(values, params) {
        return this.mapper('selectUnallocatedList', values, params);
    }

    async selectUnallocatedList(values, params) {
        return await this.db().selects(this.selectUnallocatedListMapper(values, params));
    }

    selectUserByUserNameMapper(values, params) {
        return this.mapper('selectUserByUserName', values, params);
    }

    async selectUserByUserName(values, params) {
        return await this.db().select(this.selectUserByUserNameMapper(values, params));
    }

    selectUserByIdMapper(values, params) {
        return this.mapper('selectUserById', values, params);
    }

    async selectUserById(values, params) {
        return await this.db().select(this.selectUserByIdMapper(values, params));
    }

    checkUserNameUniqueMapper(values, params) {
        return this.mapper('checkUserNameUnique', values, params);
    }

    async checkUserNameUnique(values, params) {
        return await this.db().select(this.checkUserNameUniqueMapper(values, params));
    }

    checkPhoneUniqueMapper(values, params) {
        return this.mapper('checkPhoneUnique', values, params);
    }

    async checkPhoneUnique(values, params) {
        return await this.db().select(this.checkPhoneUniqueMapper(values, params));
    }

    checkEmailUniqueMapper(values, params) {
        return this.mapper('checkEmailUnique', values, params);
    }

    async checkEmailUnique(values, params) {
        return await this.db().select(this.checkEmailUniqueMapper(values, params));
    }

    insertUserMapper(values, params) {
        return this.mapper('insertUser', values, params);
    }

    async insertUser(values, params) {
        return await this.db().insert(this.insertUserMapper(values, params));
    }

    updateUserMapper(values, params) {
        return this.mapper('updateUser', values, params);
    }

    async updateUser(values, params) {
        return await this.db().update(this.updateUserMapper(values, params));
    }

    updateUserProfileMapper(values, params) {
        return this.mapper('updateUserProfile', values, params);
    }

    async updateUserProfile(values, params) {
        return await this.db().update(this.updateUserProfileMapper(values, params));
    }

    updateUserStatusMapper(values, params) {
        return this.mapper('updateUserStatus', values, params);
    }

    async updateUserStatus(values, params) {
        return await this.db().update(this.updateUserStatusMapper(values, params));
    }

    updateUserAvatarMapper(values, params) {
        return this.mapper('updateUserAvatar', values, params);
    }

    async updateUserAvatar(values, params) {
        return await this.db().update(this.updateUserAvatarMapper(values, params));
    }

    updateLoginInfoMapper(values, params) {
        return this.mapper('updateLoginInfo', values, params);
    }

    async updateLoginInfo(values, params) {
        return await this.db().update(this.updateLoginInfoMapper(values, params));
    }

    resetUserPwdMapper(values, params) {
        return this.mapper('resetUserPwd', values, params);
    }

    async resetUserPwd(values, params) {
        return await this.db().update(this.resetUserPwdMapper(values, params));
    }

    deleteUserByIdMapper(values, params) {
        return this.mapper('deleteUserById', values, params);
    }

    async deleteUserById(values, params) {
        return await this.db().del(this.deleteUserByIdMapper(values, params));
    }

    deleteUserByIdsMapper(values, params) {
        return this.mapper('deleteUserByIds', values, params);
    }

    async deleteUserByIds(values, params) {
        return await this.db().del(this.deleteUserByIdsMapper(values, params));
    }
}

module.exports = SysUserMapperService;