// Role-based authorization configuration.
const roles = {
  superAdmin: {
    can: [
      // Doctor module permissions
      "registerDoctor",
      "updateDoctor",
      "deleteDoctor",
      "getDoctor",
      "getDoctors",
      "getDoctorDashboardStats",
      "getTodaysSchedule",

      // Manager module permissions
      "registerManager",
      "getManagersByDoctorId",
      "getManager",
      "getManagers",
      "updateManager",
      "deleteManager",

      // Patient module permissions
      "getPatients",
      "createPatient",
      "getPatient",
      "updatePatient",
      "deletePatient",

      // Appointment module permissions
      "createAppointment",
      "getAppointments",
      "getAppointment",
      "updateAppointment",
      "deleteAppointment",

      // Prescription module permissions
      "createPrescription",
      "getPrescriptions",
      "getPrescription",
      "getPrescriptionsByPatient",
      "getPrescriptionPDF",
      "updatePrescription",
      "finalizePrescription",
      "deletePrescription",

      // Doctor preferences module permissions
      "getDoctorPreferences",

      // Doctor preferences module permissions
      "updateDoctorPreferences",

      // Medical Records module permissions
      "createMedicalRecord",
      "getMedicalRecord",
      "updateMedicalRecord",
      "deleteMedicalRecord",
      "getPatientHistory",
      "getDoctorRecords",
      "searchMedicalRecords",
      "addDiagnosis",
      "addMedication",
      "addLabResult",
      "markAsReviewed",
      "getMedicalRecordStats",
      "getRecentRecords",
      "getMyRecords",
      "getDashboardSummary",
      "getRecordVersionHistory",
      "exportPatientRecords",

      // Billing module permissions
      "createBill",
      "getBills",
      "getBillById",
      "updateBill",
      "deleteBill",
      "recordPayment",
      "getBillingStats",
      "getOverdueBills",
      "markOverdueBills",
    ],
  },
  doctor: {
    can: [
      // Manager module permissions
      "registerManager",
      "getManagersByDoctorId",
      "getManager",
      "updateManager",
      "deleteManager",

      // Doctor module permissions
      "updateDoctor",
      "deleteDoctor",
      "getDoctor",
      "getDoctorDashboardStats",
      "getTodaysSchedule",

      // Patient module permissions
      "getPatients",
      "createPatient",
      "getPatient",
      "updatePatient",
      "deletePatient",

      // Appointment module permissions
      "getAppointments",
      "getAppointment",
      "updateAppointment",
      "deleteAppointment",

      // Prescription module permissions
      "createPrescription",
      "getPrescriptions",
      "getPrescription",
      "getPrescriptionsByPatient",
      "getPrescriptionPDF",
      "updatePrescription",
      "finalizePrescription",
      "deletePrescription",



      // Doctor preferences module permissions
      "getDoctorPreferences",
      "updateDoctorPreferences",

      // Billing module permissions
      "createBill",
      "getBills",
      "getBillById",
      "updateBill",
      "deleteBill",
      "recordPayment",
      "getBillingStats",
      "getOverdueBills",
    ],
  },
  manager: {
    can: [
      // Manager module permissions
      "getManager",
      "updateManager",

      // Patient module permissions
      "getPatients",
      "createPatient",
      "getPatient",
      "updatePatient",
      "deletePatient",

      // Appointment module permissions
      "createAppointment",
      "getAppointments",
      "getAppointment",
      "updateAppointment",
      "deleteAppointment",

      // Prescription module permissions
      "createPrescription",
      "getPrescriptions",
      "getPrescription",
      "getPrescriptionsByPatient",
      "getPrescriptionPDF",



      // Doctor preferences module permissions
      "getDoctorPreferences",
    ],
  },
  permissions: {
    createDryEyeTest: ["doctor", "manager"],
    updateDryEyeTest: ["doctor", "manager"],
    getDryEyeTest: ["doctor", "manager", "superAdmin"],
    deleteDryEyeTest: ["doctor", "superAdmin"],
    listDryEyeTests: ["doctor", "manager", "superAdmin"],
  },
};

module.exports = roles;
