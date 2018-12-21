const sequelizeExtend = require('./lib/sequelize.js');

/**
 * extends to think, controller, context, service
 */
module.exports = app => {
  const config = app.think.config('sequelize');
  Sequelize = config.Sequelize || require('sequelize');
  const extend = sequelizeExtend(app, Sequelize);

  return {
    controller: {
      Sequelize: Sequelize,
      sequelizeModel: extend.sequelizeModel,
      sequelizeDB: extend.sequelizeDB,
    },
    service: {
      Sequelize: Sequelize,
      sequelizeModel: extend.sequelizeModel,
      sequelizeDB: extend.sequelizeDB,
    },
    context: {
      Sequelize: Sequelize,
      sequelizeModel: extend.sequelizeModel,
      sequelizeDB: extend.sequelizeDB,
    },
    think: {
      Sequelize: Sequelize,
      sequelizeModel: extend.sequelizeModel,
      sequelizeDB: extend.sequelizeDB,
    }
  };
};
