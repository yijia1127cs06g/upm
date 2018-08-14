module.exports = {
  development:{
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql',
    timezone: '+08:00',
    pool: {
      max: 5,
      min: 0,
      acquire: 4000,
      idle: 10000                    
    }
  }
};
