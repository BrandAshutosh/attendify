const express = require('express');
const verifyToken = require('../middlewares/verifyToken.js');
const { upload } = require('../utils/uploadDocument.js');

const StartController = require('../controllers/startController.js');
const DocumentController = require('../controllers/documentController');
const AuthorizationController = require('../controllers/authorizationController.js')
const ExceptionController = require('../controllers/exceptionController.js');
const UserController = require('../controllers/userController.js');
const AttendanceController = require('../controllers/attendanceController.js');
const LeaveController = require('../controllers/leaveController.js');
const AdvanceController = require('../controllers/advanceController.js');
const HolidayController = require('../controllers/holidayController.js');
const DeviceManagerController = require('../controllers/devicemanagerController.js');
const ShiftController = require('../controllers/shiftController.js');
const ContactController = require('../controllers/contactController.js');
const VehicleController = require('../controllers/vehicleController.js');
const TripController = require('../controllers/tripController.js');


const router = express.Router();


router.post('/startSystem', StartController.startSystemApi);

router.post('/documentUpload', upload.single('document'), DocumentController.documentUpload);

router.post('/signup', AuthorizationController.signup);
router.post('/login', AuthorizationController.login);
router.post('/forgetPassword', AuthorizationController.forgetPassword);
router.post("/changePassword", AuthorizationController.changePassword);

router.post('/createException', verifyToken, ExceptionController.createException); 
router.post('/getExceptions', verifyToken, ExceptionController.getExceptions);
router.post('/getExceptionById', verifyToken, ExceptionController.getExceptionById);
router.post('/updateException', verifyToken, ExceptionController.updateException);
router.post('/deleteException', verifyToken, ExceptionController.deleteException);

router.post('/createUser', verifyToken, UserController.createUser);
router.post('/getUsers', verifyToken, UserController.getUsers);
router.post('/getUserById', verifyToken, UserController.getUserById);
router.post('/updateUser', verifyToken, UserController.updateUser);
router.post('/deleteUser', verifyToken, UserController.deleteUser);
router.post('/exportUserlist', verifyToken, UserController.exportUserlist);
router.post('/getManagers', verifyToken, UserController.getManagers);

router.post('/createAttendance', verifyToken, AttendanceController.createAttendance);
router.post('/getAttendances', verifyToken, AttendanceController.getAttendances);
router.post('/getAttendanceById', verifyToken, AttendanceController.getAttendanceById);
router.post('/updateAttendance', verifyToken, AttendanceController.updateAttendance);
router.post('/deleteAttendance', verifyToken, AttendanceController.deleteAttendance);
router.post('/exportAttendance', verifyToken, AttendanceController.exportAttendance);
router.post('/getMonthlyAttendanceGrid', verifyToken, AttendanceController.getMonthlyAttendanceGrid);

router.post('/createLeave', verifyToken, LeaveController.createLeave);
router.post('/getLeaves', verifyToken, LeaveController.getLeaves);
router.post('/getLeaveReports', verifyToken, LeaveController.getLeaveReports);
router.post('/leaveDetailsById', verifyToken, LeaveController.leaveDetailsById);
router.post('/getLeaveById', verifyToken, LeaveController.getLeaveById);
router.post('/updateLeave', verifyToken, LeaveController.updateLeave);
router.post('/deleteLeave', verifyToken, LeaveController.deleteLeave);
router.post('/exportLeave', verifyToken, LeaveController.exportLeave);
router.post('/getLeaveBalanceReport', verifyToken, LeaveController.getLeaveBalanceReport);
router.post('/createOnDuty', verifyToken, LeaveController.createOnDuty);
router.post('/getOnDuties', verifyToken, LeaveController.getOnDuties);
router.post('/getOnDutyReports', verifyToken, LeaveController.getOnDutyReports);
router.post('/onDutyDetailsById', verifyToken, LeaveController.onDutyDetailsById);

router.post('/createAdvance', verifyToken, AdvanceController.createAdvance);
router.post('/getAdvances', verifyToken, AdvanceController.getAdvances);
router.post('/getAdvanceReports', verifyToken, AdvanceController.getAdvanceReports);
router.post('/AdvanceDetailsById', verifyToken, AdvanceController.AdvanceDetailsById);
router.post('/deleteAdvance', verifyToken, AdvanceController.deleteAdvance);
router.post('/exportAdvance', verifyToken, AdvanceController.exportAdvance);

router.post('/createHoliday', verifyToken, HolidayController.createHoliday);
router.post('/getHolidays', verifyToken, HolidayController.getHolidays);
router.post('/getHolidayById', verifyToken, HolidayController.getHolidayById);
router.post('/updateHoliday', verifyToken, HolidayController.updateHoliday);
router.post('/deleteHoliday', verifyToken, HolidayController.deleteHoliday);
router.post('/exportHoliday', verifyToken, HolidayController.exportHoliday);

router.post('/createDeviceManager', verifyToken, DeviceManagerController.createDeviceManager);
router.post('/getDeviceManagers', verifyToken, DeviceManagerController.getDeviceManagers);
router.post('/getDeviceManagerById', verifyToken, DeviceManagerController.getDeviceManagerById);
router.post('/getDeviceManagerByUserId', verifyToken, DeviceManagerController.getDeviceManagerByUserId);
router.post('/deleteDeviceManager', verifyToken, DeviceManagerController.deleteDeviceManager);
router.post('/exportDeviceManager', verifyToken, DeviceManagerController.exportDeviceManager);

router.post('/createShift', verifyToken, ShiftController.createShift);
router.post('/getShifts', verifyToken, ShiftController.getShifts);
router.post('/getShiftById', verifyToken, ShiftController.getShiftById);
router.post('/updateShift', verifyToken, ShiftController.updateShift);
router.post('/deleteShift', verifyToken, ShiftController.deleteShift);
router.post('/exportShifts', verifyToken, ShiftController.exportShifts);

router.post('/createContact', verifyToken, ContactController.createContact);
router.post('/getContacts', verifyToken, ContactController.getContacts);
router.post('/getContactById', verifyToken, ContactController.getContactById);
router.post('/updateContact', verifyToken, ContactController.updateContact);
router.post('/deleteContact', verifyToken, ContactController.deleteContact);        
router.post('/exportContacts', verifyToken, ContactController.exportContacts);

router.post('/createVehicle', verifyToken, VehicleController.createVehicle);
router.post('/getVehicleByUserId', verifyToken, VehicleController.getVehicleByUserId);
router.post('/getVehicles', verifyToken, VehicleController.getVehicles);
router.post('/getVehicleDetailsById', verifyToken, VehicleController.getVehicleDetailsById);
router.post('/updateVehicle', verifyToken, VehicleController.updateVehicle);
router.post('/deleteVehicle', verifyToken, VehicleController.deleteVehicle);
router.post('/exportVehicles', verifyToken, VehicleController.exportVehicles);

router.post('/createTrip', verifyToken, TripController.createTrip);
router.post('/getTrips', verifyToken, TripController.getTrips);
router.post('/getClaimedTrips', verifyToken, TripController.getClaimedTrips);
router.post('/getTripReports', verifyToken, TripController.getTripReports);
router.post('/getTripById', verifyToken, TripController.getTripById);
router.post('/updateTrip', verifyToken, TripController.updateTrip);
router.post('/deleteTrip', verifyToken, TripController.deleteTrip);
router.post('/acceptTrip', verifyToken, TripController.acceptTrip);
router.post('/rejectTrip', verifyToken, TripController.rejectTrip);


module.exports = router;