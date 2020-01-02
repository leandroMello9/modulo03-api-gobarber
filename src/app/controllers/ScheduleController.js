import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import Appointments from '../models/Appointments';
import User from '../models/User';

class SheduleController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: {
        id: req.userId,
        provider: true,
      },
    });
    if (!checkUserProvider) {
      return res.status(401).json({ error: 'User is not a provider' });
    }

    // 2019-08-22 00:00:00

    // 2019-08-22 23:59:59

    const { date } = req.query;
    const parseDate = parseISO(date);
    // Listando Agendamentos
    const appointments = await Appointments.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parseDate), endOfDay(parseDate)],
        },
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['name']
      }],
      order: ['date'],
    });

    return res.json(appointments);
  }
}
export default new SheduleController();
