// // backend/config/database.js
// import { Sequelize } from 'sequelize';

// const sequelize = new Sequelize(
//   process.env.DB_NAME || 'qr_generator',
//   process.env.DB_USER || 'postgres',
//   process.env.DB_PASSWORD || 'password',
//   {
//     host: process.env.DB_HOST || 'localhost',
//     dialect: 'postgres',
//     logging: false, // Set to true for debugging
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     }
//   }
// );

// export const connectDB = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ PostgreSQL Connected Successfully');
//     await sequelize.sync(); // Creates tables if they don't exist
//   } catch (error) {
//     console.error('❌ Database connection failed:', error);
//     process.exit(1);
//   }
// };

// export default sequelize;





// backend/config/database.js - ULTRA SIMPLE
export const connectDB = async () => {
  console.log('✅ App running without database');
};

export default {
  authenticate: () => Promise.resolve(),
  sync: () => Promise.resolve(),
  define: () => ({
    create: () => Promise.resolve(),
    count: () => Promise.resolve(0),
    findAll: () => Promise.resolve([])
  })
};