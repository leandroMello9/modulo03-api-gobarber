import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
} from 'date-fns';
import { Op } from 'sequelize';
import Appointments from '../models/Appointments';

class AvailableController {
  async index(req, res) {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Invalid date' });
    }
    const searchDate = Number(date);
    const appointments = await Appointments.findAll({
      where: {
        provider_id: req.params.providerId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
    });
    // 2019-10-24 11:51:33
    const schedule = [
      '08:00', // 2019-10-24 08:00:00
      '09:00', // 2019-10-24 09:00:00
      '10:00', // 2019-10-24 10:00:00
      '11:00', // 2019-10-24 11:00:00
      '12:00', // 2019-10-24 12:00:00
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ];
    const avaiable = schedule.map(time => {
      const [hour, minut] = time.split(':');
      const value = setSeconds(
        setMinutes(setHours(searchDate, hour), minut),
        0
      );
      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available:
          isAfter(value, new Date()) &&
          !appointments.find(a => format(a.date, 'HH:mm') === time),
      };
    });
    return res.json(avaiable);
  }
}

export default new AvailableController();
