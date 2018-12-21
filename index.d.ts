import * as sequelize from "sequelize";

declare namespace thinkSequelizePlus {
  interface ModelExtend {
    Sequelize: sequelize.SequelizeStatic;

    sequelizeDB(name: string): sequelize.Sequelize;

    sequelizeModel(modelName: string): sequelize.Model;
  }
}

declare module 'thinkjs' {
  interface Think extends thinkSequelizePlus.ModelExtend {
  }

  interface Controller extends thinkSequelizePlus.ModelExtend {
  }

  interface Context extends thinkSequelizePlus.ModelExtend {
  }

  interface Service extends thinkSequelizePlus.ModelExtend {
  }
}
