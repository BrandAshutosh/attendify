const FORGETPASSWORD_MAIL = `Password Reset Request\nHi {{firstName}},\nYour new password is: {{newPassword}}\nClick the link below to log in:\nIf you didn’t request this password reset, please contact us at socygen@gmail.com.\nStay Safe,\nDeveloper Team`;
const VERIFY_ACCOUNT_MAIL = `Account Verification\nHi {{firstName}} {{lastName}},\nThank you for registering with us.\nClick the link below to verify your account:\n{{verificationUrl}}\nIf you didn’t initiate this request, please contact us at socygen@gmail.com.\nStay Safe,\nDeveloper Team`;
const DELETE_DATA_MAIL = `<b>Records Deletion Notification</b><br><br>Hi {{firstName}},<br>The following records have been removed from your account.<br>Please find the attached file for more details.<br>If you didn’t request this action, please contact us at socygen@gmail.com.<br>Stay Safe,<br>Developer Team`;
const EXPORT_DATA_MAIL = `<b>Records Export Notification</b><br><br>Hi {{firstName}},<br>Your requested IP Whitelist records have been successfully exported.<br>Please find the attached file for more details.<br>If you didn’t request this export, please contact us at socygen@gmail.com.<br>Stay Safe,<br>Developer Team`;
const SIGNUP_MAIL = `Welcome to Attendify\n\nHi {{firstName}} {{lastName}},\n\nThank you for signing up with Ashae Services.\nWe're excited to have you with us!\n\nHere are your login details:\nEmail: {{email}}\nMobile: {{mobile}}\nPassword: {{password}}\n\nYou can now log in using your registered credentials.\n\nIf you didn’t sign up for this account, please contact us at socygen@gmail.com.\n\nStay Safe,\nDeveloper Team`;

module.exports = { 
 FORGETPASSWORD_MAIL, 
 VERIFY_ACCOUNT_MAIL,
 DELETE_DATA_MAIL,
 EXPORT_DATA_MAIL,
 SIGNUP_MAIL
};