import { DataTypes } from 'sequelize';

const User = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'user' // 'super_admin', 'supervisor', 'data_entry'
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending' // 'pending', 'approved', 'rejected'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        approved_at: {
            type: DataTypes.DATE
        },
        two_factor_secret: {
            type: DataTypes.STRING,
            allowNull: true
        },
        two_factor_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        profile_picture: {
            type: DataTypes.STRING,
            allowNull: true
        },
        bio: {
            type: DataTypes.STRING,
            allowNull: true
        },
        job_title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: false
    });

    return User;
};

export default User;
