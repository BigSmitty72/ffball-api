import sequelize from 'sequelize';

const defaultDbOptions = {
  'dialect': 'mariadb',
  'pool': {
    'max': 5,
    'min': 0,
    'idle': 10000
  }
};

export const normalizeDialect = (dialect) => {
  const supportedDialects = ['mariadb', 'mssql', 'mysql', 'postgres', 'sqlite'];

  if (typeof dialect === 'string') {
    for (let i = 0, len = supportedDialects.length; i <= len; i++) {
      if (dialect.toLowerCase().includes(supportedDialects[i])) {
        return supportedDialects[i];
      }
    }
  }
  return dialect;
};

const generateSequelizeInstance = (config, Sequelize) => {
  // construct full url
  let url = config.DB_SQL_URL || '';
  if (url && config.DB_SQL_USERNAME) {
    const parts = url.split('://');
    url = `${normalizeDialect(parts[0])}://${encodeURIComponent(config.DB_SQL_USERNAME)}:${encodeURIComponent(config.DB_SQL_PASSWORD)}@${parts[1]}`;
  }

  // Generate the sequalize instance
  return new Sequelize(
    url,
    Object.assign(defaultDbOptions, JSON.parse(config.DB_SQL_OPTIONS) || {})
  );
};

export class Database {
  constructor(config, Sequelize = sequelize) {
    this.sequelize = generateSequelizeInstance(config, Sequelize);
  }

  get sequelize() {
    return this.constructor.sequelize;
  }
  set sequelize(value) {
    this.constructor.sequelize = value;
  }

  insert(query, queryParams) {
    try {
      return this.sequelize.query(query, {bind: queryParams, type: this.sequelize.QueryTypes.INSERT });
    } catch (err) {
      console.log(err.message);
      return undefined;
    }
  }

  select(query, queryParams) {
    try {
      return this.sequelize.query(query, {bind: queryParams, type: this.sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.log(err.message);
      return undefined;
    }
  }

  async selectOne(query, queryParams) {
    try {
      const result = await this.select(query, queryParams);
      if (Array.isArray(result)) {
        return (result.length > 0) ? result[0] : undefined;
      } else {
        return result;
      }
    } catch (err) {
      console.log(err.message);
      return undefined;
    }
  }
}

export class DatabaseRL {
  constructor(config, Sequelize = sequelize) {
    this.sequelize = generateSequelizeInstance(config, Sequelize);
  }

  get sequelize() {
    return this.constructor.sequelize;
  }
  set sequelize(value) {
    this.constructor.sequelize = value;
  }

  insert(query, queryParams) {
    try {
      return this.sequelize.query(query, {bind: queryParams, type: this.sequelize.QueryTypes.INSERT });
    } catch (err) {
      console.log(err.message);
      return err.message;
    }
  }

  select(query, queryParams) {
    try {
      return this.sequelize.query(query, {bind: queryParams, type: this.sequelize.QueryTypes.SELECT }).then((data) => {
        console.log(data);
        return data;
      });
    } catch (err) {
      console.log(err.message);
      return undefined;
    }
  }

  async selectOne(query, queryParams) {
    try {
      const result = await this.select(query, queryParams);
      if (Array.isArray(result)) {
        return (result.length > 0) ? result[0] : undefined;
      } else {
        return result;
      }
    } catch (err) {
      console.log(err.message);
      return undefined;
    }
  }
}
