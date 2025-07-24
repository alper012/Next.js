const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const Teacher = require("./models/Teacher");
const Student = require("./models/Student");
const PendingUser = require("./models/PendingUser");

async function checkUsers() {
  try {
    console.log("=== Checking Database Users ===\n");

    // Check Teachers
    const teachers = await Teacher.find({});
    console.log("Teachers:", teachers.length);
    teachers.forEach((t) => console.log(`- ${t.email} (${t.role})`));

    // Check Students
    const students = await Student.find({});
    console.log("\nStudents:", students.length);
    students.forEach((s) => console.log(`- ${s.email} (${s.role})`));

    // Check Pending Users
    const pending = await PendingUser.find({});
    console.log("\nPending Users:", pending.length);
    pending.forEach((p) => console.log(`- ${p.email}`));

    console.log("\n=== End ===");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers();
