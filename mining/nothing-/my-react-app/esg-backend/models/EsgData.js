import Sequelize from "sequelize";
const { DataTypes } = Sequelize;

// Lazy load database connection
let sequelize;
const getSequelize = () => {
  if (!sequelize) {
    const db = require("../config/db");
    sequelize = db.sequelize;
  }
  return sequelize;
};

const ESGData = () => {
  const seq = getSequelize();
  return seq.define("esg_data", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  environmentalScore: { type: DataTypes.FLOAT, allowNull: false },
  socialScore: { type: DataTypes.FLOAT, allowNull: false },
  governanceScore: { type: DataTypes.FLOAT, allowNull: false },
  complianceRate: { type: DataTypes.FLOAT },
  sustainabilityIndex: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
}, {
  timestamps: false,
  freezeTableName: true,
  indexes: [
    {
      fields: ['companyName']
    },
    {
      fields: ['year']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['companyName', 'year'],
      unique: true
    }
  ]
  });
};

export default ESGData;
