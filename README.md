# think-sequelize-plus
[![NPM version][npm-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/think-sequelize-plus.svg?style=flat-square
[npm-url]: https://npmjs.org/package/think-sequelize-plus

Thinkjs's mongoose plugin.

## Install

```bash
$ npm i think-sequelize-plus --save
```

## Usage & configuration

Change `{app_root}/src/config/extend.ts` to enable `think-sequelize-plus` plugin:

```typescript
const sequelize = require('think-sequelize-plus');

export = [
  sequelize(think.app), //  sequelize
]
```

### Config

```typescript
/**
 * sequelize adapter config
 * @type {Object}
 */
export const sequelize = {
  type: "test",
  test: {
    database: 'test',
    username: 'root',
    password: '',
    options: {
      host: 'localhost',
      port: '3306',
      dialect: 'mysql',
      timezone: '+08:00',
      define: {
        "timestamps": false
      }
    }
  }
};
```

think-sequelize-plus has a default sequelize options below

```typescript
{
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
```
More documents please refer to [Sequelize.js](http://docs.sequelizejs.com/manual/installation/usage.html)

## Model files

Please put models under `{app_root}/src/model` dir.

## Examples

### Standard

Define a model first.

```typescript
// {app_root}/src/model/user.ts
import {think, Application} from "thinkjs";

// Do not use arrow function. ()=>{} !important
export = function (app: Application) {
  const { STRING, INTEGER, DATE } = think.Sequelize;
 
  const User = think.sequelizeDB("test").define('user', {
    login: STRING,
    name: STRING(30),
    password: STRING(32),
    age: INTEGER,
    last_sign_in_at: DATE,
    created_at: DATE,
    updated_at: DATE,
  });
 
  User.findByLogin = async (login) => {
    return await this.findOne({
      where: {
        login: login
      }
    });
  }
 
  User.prototype.logSignin = async () => {
    return await this.update({ last_sign_in_at: new Date() });
  }
 
  return User;
};
```

Now you can use it in your controller:

```typescript
// {app_root}/src/controller/user.ts
import {think} from 'thinkjs';

export default class extends think.Controller {
  async indexAction() {
    const users = await this.sequelizeModel('user').findAll();
    this.body = users;
  }
  
  async showAction() {
    const users = await this.sequelizeModel('user').findAll();
    await user.logSignin();
    this.body = users;
  }
}
```
### Associate
Define all your associations in `Model.associate()` and egg-sequelize will execute it after all models loaded. See example below.

### Multiple Datasources

think-sequelize-plus support load multiple datasources independently. You can use `config.sequelize.datasources` to configure and load multiple datasources.

```typescript
// {app_root}/src/config/adapter.ts
/**
 * sequelize adapter config
 * @type {Object}
 */
export const sequelize = {
  type: "db1",
  db1: {
    database: 'db1',
    username: 'root',
    password: '',
    options: {
      // other sequelize configurations
    }
  },
  db2: {
    database: 'db2',
    username: 'root',
    password: '',
    options: {
      // other sequelize configurations
    }
  },
};
```
Then we can define model like this:


```typescript
// {app_root}/src/model/user1.ts
import {think, Application} from "thinkjs";

// Do not use arrow function. ()=>{} !important
export = function (app: Application) {
  const { STRING, INTEGER, DATE } = think.Sequelize;
 
  const User = think.sequelizeDB("db1").define('user', {
    login: STRING,
    name: STRING(30),
    password: STRING(32),
    age: INTEGER,
    last_sign_in_at: DATE,
    created_at: DATE,
    updated_at: DATE,
  });
 
  return User;
};

// {app_root}/src/model/user2.ts
import {think, Application} from "thinkjs";

// Do not use arrow function. ()=>{} !important
export = function (app: Application) {
  const { STRING, INTEGER, DATE } = think.Sequelize;
 
  const User = think.sequelizeDB("db2").define('user', {
    login: STRING,
    name: STRING(30),
    password: STRING(32),
    age: INTEGER,
    last_sign_in_at: DATE,
    created_at: DATE,
    updated_at: DATE,
  });
 
  return User;
};
```

### Customize Sequelize 

By default, egg-sequelize will use sequelize@4, you can cusomize sequelize version by pass sequelize instance with config.Sequelize like this:    
```typescript
// {app_root}/src/config/adapter.ts
/**
 * sequelize adapter config
 * @type {Object}
 */
export const sequelize = {
  Sequelize: require('sequelize'),
  
  type: "test",
  test: {
    database: 'test',
    username: 'root',
    password: '',
    options: {
      host: 'localhost',
      port: '3306',
      dialect: 'mysql',
      timezone: '+08:00',
      define: {
        "timestamps": false
      }
    }
  }
};
```

### Full example

```typescript
// {app_root}/src/model/post.ts
import {think, Application} from "thinkjs";

export = function (app: Application) {

  const {STRING, BIGINT} = think.Sequelize;

  const Post: any = think.sequelizeDB("didapinche").define('user_user', {
      name: STRING(30),
      user_id: INTEGER,
      created_at: DATE,
      updated_at: DATE,
    },
    {
      freezeTableName: true,
    });

  Post.associate = function () {
    think.sequelizeModel("post").belongsTo(think.sequelizeModel("user"), {as: 'user'});
  };

  return Post;
};
```

```typescript
// {app_root}/src/controller/post.ts
import {think} from "thinkjs";
import Base from './base.js';

export default class extends think.Controller {
  async indexAction() {
    const posts = await this.sequelizeModel('post').findAll({
       attributes: [ 'id', 'user_id' ],
       include: { model: this.ctx.model.User, as: 'user' },
       where: { status: 'publish' },
       order: 'id desc',
     });
    this.body = posts;
  }

  async showAction() {
    const post = await this.sequelizeModel('post').findById(this.get("id"));
    const user = await post.getUser();
    post.setDataValue('user', user);
    this.body = post;
  }

  async destroyAction() {
    const post = await this.sequelizeModel('post').findById(this.get("id"));
    await post.destroy();
    this.body = { success: true };
  }
}

```

## License

[MIT](LICENSE)
