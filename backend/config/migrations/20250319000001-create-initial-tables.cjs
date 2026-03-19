'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('creator', 'buyer'), allowNull: false, defaultValue: 'buyer' },
      name: { type: Sequelize.STRING(255), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('creators', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      user_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      display_name: { type: Sequelize.STRING(255), allowNull: false },
      bio: { type: Sequelize.TEXT },
      stripe_connect_account_id: { type: Sequelize.STRING(255) },
      razorpay_linked_account_id: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('sessions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      creator_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'creators', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING(500), allowNull: false },
      session_date: { type: Sequelize.DATEONLY, allowNull: false },
      session_tz: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'UTC' },
      window_start_minute: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
      window_end_minute: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
      slot_duration_minutes: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
      price_amount: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'usd' },
      cancelled_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('slots', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      session_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'sessions', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      start_utc: { type: Sequelize.DATE(3), allowNull: false },
      end_utc: { type: Sequelize.DATE(3), allowNull: false },
      status: { type: Sequelize.ENUM('available', 'locked', 'booked'), allowNull: false, defaultValue: 'available' },
      lock_expires_at: { type: Sequelize.DATE(3) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('group_sessions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      creator_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'creators', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING(500), allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      session_tz: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'UTC' },
      daily_start_minute: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
      daily_end_minute: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
      max_participants: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      price_amount: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'usd' },
      cancelled_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('products', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      creator_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'creators', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(500), allowNull: false },
      description: { type: Sequelize.TEXT },
      price_amount: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'usd' },
      stock: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      delivery_regions: { type: Sequelize.JSON, allowNull: false },
      image_url: { type: Sequelize.STRING(2048) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('payments', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      provider: { type: Sequelize.ENUM('stripe', 'razorpay'), allowNull: false },
      purpose: { type: Sequelize.ENUM('slot', 'group', 'product'), allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      creator_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'creators', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      amount_total: { type: Sequelize.BIGINT, allowNull: false },
      platform_fee: { type: Sequelize.BIGINT, allowNull: false },
      creator_amount: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'requires_action', 'authorized', 'captured', 'failed', 'refunded_partial', 'refunded_full'),
        allowNull: false,
        defaultValue: 'pending',
      },
      external_order_id: { type: Sequelize.STRING(255) },
      external_payment_id: { type: Sequelize.STRING(255) },
      external_client_secret: { type: Sequelize.TEXT },
      booking_id: { type: Sequelize.UUID },
      group_booking_id: { type: Sequelize.UUID },
      order_id: { type: Sequelize.UUID },
      scheduled_transfer_at: { type: Sequelize.DATE },
      transferred_at: { type: Sequelize.DATE },
      metadata: { type: Sequelize.JSON },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      slot_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'slots', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      payment_id: { type: Sequelize.UUID, references: { model: 'payments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      status: {
        type: Sequelize.ENUM('pending_payment', 'confirmed', 'cancelled_user', 'cancelled_creator'),
        allowNull: false,
        defaultValue: 'pending_payment',
      },
      cancelled_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('group_bookings', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      group_session_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'group_sessions', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      payment_id: { type: Sequelize.UUID, references: { model: 'payments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      status: {
        type: Sequelize.ENUM('pending_payment', 'confirmed', 'cancelled_user', 'cancelled_creator'),
        allowNull: false,
        defaultValue: 'pending_payment',
      },
      cancelled_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('group_bookings', ['user_id', 'group_session_id'], { unique: true });

    await queryInterface.createTable('orders', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      status: {
        type: Sequelize.ENUM('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending_payment',
      },
      shipping_address: { type: Sequelize.JSON },
      payment_id: { type: Sequelize.UUID, references: { model: 'payments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      cancelled_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('refunds', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      payment_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'payments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      amount: { type: Sequelize.BIGINT, allowNull: false },
      reason: { type: Sequelize.STRING(500) },
      status: { type: Sequelize.ENUM('pending', 'succeeded', 'failed'), allowNull: false, defaultValue: 'pending' },
      external_refund_id: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refunds');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('group_bookings');
    await queryInterface.dropTable('bookings');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('group_sessions');
    await queryInterface.dropTable('slots');
    await queryInterface.dropTable('sessions');
    await queryInterface.dropTable('creators');
    await queryInterface.dropTable('users');
  },
};
