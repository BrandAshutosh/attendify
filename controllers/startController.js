const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.startSystemApi = async (req, res) => {
    try {
        const staticUserData = {
            clientId: 10000,
            type: 1,
            package: 1,
            designation: 'Admin',
            reportingTo: 'Admin',
            reportingToId: 1,
            shift: 'Day Shift' ,
            department: 'Admin',
            firstName: 'Ashutosh',
            middleName: 'Kumar',
            lastName: 'Choubey',
            dob: '07-10-1994',
            emailId: 'choubeyashu2@gmail.com',
            mobile: '7370835407',
            country: 'India',
            state: 'Bihar',
            district: 'Rohtas',
            city: 'Sasaram',
            landmark: 'Near Shiv Mandir',
            pincode: 800023,
            address: 'Samardihan, Sasaram, Rohtas, Bihar, Pincode - 821113',
            aadharnumber: '708478896809',
            pannumber: 'BSQPC4438P',
            password: '12345',
            permission: {},
            imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
            fcmToken: '',
            accountNumber: '1234567890',
            ifscCode: 'SBIN0001234',
            bankName: 'State Bank of India',
            isActive: 1,
            createdBy: 'Ashutosh Kumar Choubey',
            updatedBy: 'Ashutosh Kumar Choubey',
            creatorIp: '127.0.0.1',
            updatorIp: '127.0.0.1'
        };

        let user = await User.findOne({ emailId: staticUserData.emailId });

        if (!user) {
            const salt = await bcrypt.genSalt(10);
            staticUserData.password = await bcrypt.hash(staticUserData.password, salt);
            user = new User(staticUserData);
            await user.save();
        }

        const token = jwt.sign({ memberData: user.toJSON() }, process.env.TOKEN_KEY, { expiresIn: '2d' });

        return res.status(200).json({
            status: true,
            message: 'System Started Successfully',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        });
    }
};