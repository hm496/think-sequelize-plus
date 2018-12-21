'use strict';

const assert = require('assert');
const path = require('path');
const sleep = require('mz-modules/sleep');
const AUTH_RETRIES = Symbol('authenticateRetries');
const helper = require('think-helper');
const merge = require('deepmerge');

let count = 0;
const cacheConn = {};
const cacheModel = {};
/*
* cacheModel:
* {
*   "delegateName":{
*     "modelName:" Model,
*     "test/user": Model,
*   }
* }
* */

const countDBErr = {};
let isInit = false; // 是否已初始化

module.exports = (app, Sequelize) => {
  const config = app.think.config('sequelize');

  const defaultConfig = {
    username: 'root',
    options: {
      host: 'localhost',
      port: 3306,
      operatorsAliases: Sequelize.Op,
      logging (...args) {
        // if benchmark enabled, log used
        const used = typeof args[1] === 'number' ? `(${args[1]}ms)` : '';
        think.logger.info('[think-sequelize-plus]%s %s', used, args[0]);
      },
      timezone: "+08:00",
      benchmark: true,
      define: {
        freezeTableName: true,
      },
    }
  };

  /**
   * init associate
   */
  function initAssociate (config = {}) {
    Object.keys(app.models).forEach(model => {
      if (app.models && typeof app.models[model] === "function") {
        let Model = null;
        try {
          Model = app.models[model](app);
        } catch (e) {
          return;
        }
        if (!Model || !Model.sequelize) {
          return;
        }
        cacheModel[model] = Model;
      }
    });
    Object.keys(cacheModel).forEach(model => {
      if (cacheModel[model] && typeof cacheModel[model].associate === 'function') {
        cacheModel[model].associate();
      }
    });
  }

  app.on("appReady", () => {
    initAssociate();
  });

  /**
   * load databse
   * @param {Object} config for load
   * @return {Object} sequelize instance
   */
  function loadDatabase (config = {}) {
    const type = config.type;
    if (!config.database) {
      throw new Error(`[think-sequelize-plus] database is required`);
    }
    const database = config.database;
    if (cacheConn[type]) {
      return cacheConn[type];
    }
    config = merge(defaultConfig, config);

    const sequelize = new Sequelize(config.database, config.username, config.password, config.options);
    cacheConn[type] = sequelize;

    authenticate(cacheConn[type]); // 测试数据库连接

    return cacheConn[type];
  }

  /**
   * Authenticate to test Database connection.
   *
   * This method will retry 3 times when database connect fail in temporary, to avoid Egg start failed.
   * @param {Application} database instance of sequelize
   */
  async function authenticate (database) {
    database[AUTH_RETRIES] = database[AUTH_RETRIES] || 0;

    try {
      await database.authenticate();
    } catch (e) {
      if (e.name !== 'SequelizeConnectionRefusedError') throw e;
      if (database[AUTH_RETRIES] >= 3) throw e;

      // sleep 2s to retry, max 3 times
      database[AUTH_RETRIES] += 1;
      think.logger.warn(`Sequelize Error: ${e.message}, sleep 2 seconds to retry...`);
      await sleep(2000);
      await authenticate(database);
    }
  }

  return {
    // 获取sequelize client实例
    sequelizeDB: function (name) {
      let config = helper.parseAdapterConfig(app.think.config('sequelize'), name);
      return loadDatabase(config);
    },
    // 获取sequelize Model实例
    sequelizeModel: function (model) {
      if (cacheModel[model]) {
        return cacheModel[model];
      } else if (app.models && typeof app.models[model] === "function") {
        const Model = app.models[model](app);
        if (!Model.sequelize) {
          return null;
        }
        cacheModel[model] = Model;
        return cacheModel[model];
      }
    }
  }
};
