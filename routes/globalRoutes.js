const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');

const startController = require('../controllers/startController.js');
const authorizationController = require('../controllers/authorizationController.js')
const exceptionController = require('../controllers/exceptionController.js');
const UserController = require('../controllers/userController.js');
const AttendanceController = require('../controllers/attendanceController.js');

const router = express.Router();

router.post('/startSystem', startController.startSystemApi);

router.post('/signup', authorizationController.signup);
router.post('/login', authorizationController.login);
router.post('/forgetPassword', authorizationController.forgetPassword);

router.post('/createException', verifyToken, exceptionController.createException); 
router.post('/getExceptions', verifyToken, exceptionController.getExceptions);
router.post('/getExceptionById', verifyToken, exceptionController.getExceptionById);
router.post('/updateException', verifyToken, exceptionController.updateException);
router.post('/deleteException', verifyToken, exceptionController.deleteException);

router.post('/createUser', verifyToken, UserController.createUser);
router.post('/getUsers', verifyToken, UserController.getUsers);
router.post('/getUserById', verifyToken, UserController.getUserById);
router.post('/updateUser', verifyToken, UserController.updateUser);
router.post('/deleteUser', verifyToken, UserController.deleteUser);
router.post('/exportUserlist', verifyToken, UserController.exportUserlist);

router.post('/createAttendance', verifyToken, AttendanceController.createAttendance);
router.post('/getAttendances', verifyToken, AttendanceController.getAttendances);
router.post('/getAttendanceById', verifyToken, AttendanceController.getAttendanceById);
router.post('/updateAttendance', verifyToken, AttendanceController.updateAttendance);
router.post('/deleteAttendance', verifyToken, AttendanceController.deleteAttendance);
router.post('/exportAttendance', verifyToken, AttendanceController.exportAttendance);


module.exports = router;