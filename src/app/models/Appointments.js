import Sequelize, { Model } from 'sequelize';
import {isBefore, subHours} from 'date-fns'
class Appointments extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
        //Verificando se o horario do agendamento já passou
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.date, new Date());
          }
        },
        cancelable: {
          type: Sequelize.VIRTUAL,
          get() {
            //Verificando se a data atual e anterior a 2horas ao horario  agendado
            return isBefore(new Date(), subHours(this.date, 2))
          }
        },
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `http://localhost:3333/files/${this.path}`;
          },
        },
      },
      {
        sequelize,
      }
    );
    // Antes de todo usuario se cadastro addHook sera executado de forma automatica

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'provider_id', as: 'provider' });
  }
}
export default Appointments;
