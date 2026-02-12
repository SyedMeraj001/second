import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CustomTaxonomy = sequelize.define('CustomTaxonomy', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    metrics: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    mapped_frameworks: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    validation_rules: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'custom_taxonomies',
    timestamps: true,
    underscored: true
  });

  return CustomTaxonomy;
};
