import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointments from '../models/Appointments';
import User from '../models/User';
import File from '../models/File';
import Notification from '../Schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    // Listando todos os agendamentos feitas pelo usuario
    const appointments = await Appointments.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date', 'past', 'cancelable'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { provider_id, date } = req.body;
    /**
     * Checando se o provider_id é realmente um provider
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });
    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }
    const hourStart = startOfHour(parseISO(date));

    // Verificando se a data que o usuario informou já passou
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }
    /**
     * Checando se o provider ja tem a data agendamento na data que o  usuario requistou o agendamento
     */
    const checkAvailability = await Appointments.findOne({
      where: { provider_id, canceled_at: null, date: hourStart },
    });
    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointments date is not available' });
    }
    const appointments = await Appointments.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });
    // Notificando o prestador de serviço

    const user = await User.findByPk(req.userId);
    const formatDate = format(hourStart, "'dia' dd 'de' MMMM', ás ' H:mm'h '", {
      locale: pt,
    });
    await Notification.create({
      content: `Novo Agendamento de ${user.name} para  ${formatDate}`,
      user: provider_id,
    });
    return res.json(appointments);
  }

  async delete(req, res) {
    const appointments = await Appointments.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointments.user_id !== req.userId) {
      res.status(401).json({
        error: "You don't hava permisson to cancel this appointemntes",
      });
    }
    const dateWithSub = subHours(appointments.date, 2);
    // 13:00
    // dateWithSub = 11:00
    // now : 12:16
    if (isBefore(dateWithSub, new Date())) {
      return res
        .status(401)
        .json({ error: 'VocÊ só pode cancelar com 2 horas de antecedencia' });
    }
    appointments.canceled_at = new Date();
    await appointments.save();
    await Queue.add(CancellationMail.key, {
      appointments,
    });
    return res.json(appointments);
  }
}

export default new AppointmentController();
