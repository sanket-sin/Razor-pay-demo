import { sequelize } from '../config/database.js';
import defineUser from './User.js';
import defineCreator from './Creator.js';
import defineSession from './Session.js';
import defineSlot from './Slot.js';
import defineBooking from './Booking.js';
import defineGroupSession from './GroupSession.js';
import defineGroupBooking from './GroupBooking.js';
import defineProduct from './Product.js';
import defineOrder from './Order.js';
import definePayment from './Payment.js';
import defineRefund from './Refund.js';

const User = defineUser(sequelize);
const Creator = defineCreator(sequelize);
const Session = defineSession(sequelize);
const Slot = defineSlot(sequelize);
const Booking = defineBooking(sequelize);
const GroupSession = defineGroupSession(sequelize);
const GroupBooking = defineGroupBooking(sequelize);
const Product = defineProduct(sequelize);
const Order = defineOrder(sequelize);
const Payment = definePayment(sequelize);
const Refund = defineRefund(sequelize);

User.hasOne(Creator, { foreignKey: 'userId', as: 'creatorProfile' });
Creator.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Creator.hasMany(Session, { foreignKey: 'creatorId', as: 'sessions' });
Session.belongsTo(Creator, { foreignKey: 'creatorId', as: 'creator' });

Session.hasMany(Slot, { foreignKey: 'sessionId', as: 'slots' });
Slot.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Booking.belongsTo(Slot, { foreignKey: 'slotId', as: 'slot' });

Creator.hasMany(GroupSession, { foreignKey: 'creatorId', as: 'groupSessions' });
GroupSession.belongsTo(Creator, { foreignKey: 'creatorId', as: 'creator' });

User.hasMany(GroupBooking, { foreignKey: 'userId', as: 'groupBookings' });
GroupBooking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
GroupBooking.belongsTo(GroupSession, { foreignKey: 'groupSessionId', as: 'groupSession' });

Creator.hasMany(Product, { foreignKey: 'creatorId', as: 'products' });
Product.belongsTo(Creator, { foreignKey: 'creatorId', as: 'creator' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Payment.belongsTo(Creator, { foreignKey: 'creatorId', as: 'creator' });
Payment.hasMany(Refund, { foreignKey: 'paymentId', as: 'refunds' });
Refund.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

Booking.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
GroupBooking.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
Order.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

export {
  sequelize,
  User,
  Creator,
  Session,
  Slot,
  Booking,
  GroupSession,
  GroupBooking,
  Product,
  Order,
  Payment,
  Refund,
};
