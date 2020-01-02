import Notification from '../Schemas/Notification';
import User from '../models/User';

class NotificationController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: {
        id: req.userId,
        provider: true,
      },
    });
    if (!checkUserProvider) {
      return res
        .status(401)
        .json({ error: 'Only provider can load notification' });
    }
    const notification = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);
    return res.json(notification);
  }

  async update(req, res) {
    const { id } = req.params;
    // const notification = await Notification.findById(id);
    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        read: true,
      },
      { new: true }
    );
    return res.json(notification);
  }
}

export default new NotificationController();
