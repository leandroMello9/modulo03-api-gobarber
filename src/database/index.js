import Sequelize from 'sequelize';
import mongoose from 'mongoose';
import User from '../app/models/User';
import File from '../app/models/File';
import Appointments from '../app/models/Appointments';
import databaseconfig from '../config/database';

const models = [User, File, Appointments];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  // Conexão com o banco de dados e os models
  init() {
    this.connection = new Sequelize(databaseconfig);
    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }

  mongo() {
    this.mongoConnection = mongoose.connect(
      'mongodb://192.168.99.100:27017/gobaber',
      {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true,
      }
    );
  }
}

export default new Database();
