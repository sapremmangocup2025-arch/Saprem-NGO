const Staff = require("../models/Staff");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/mail");

// Create new staff member
exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, department, designation, project, assignedVillages, supervisor } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create user account
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "staff"
    });

    // Generate unique employee ID
    let employeeId;
    let isUnique = false;
    let counter = 1;
    
    // Keep trying until we find a unique employee ID
    while (!isUnique) {
      employeeId = `EMP${String(counter).padStart(4, '0')}`;
      const existingStaff = await Staff.findOne({ employeeId });
      if (!existingStaff) {
        isUnique = true;
      } else {
        counter++;
      }
    }

    // Create staff profile
    const staff = await Staff.create({
      user: user._id,
      employeeId,
      name,
      email,
      phone,
      department,
      designation,
      project,
      assignedVillages: assignedVillages || [],
      supervisor
    });

    console.log('👤 Staff member created:', staff.name, 'ID:', staff.employeeId);

    // Send welcome email with credentials
    try {
      await sendMail({
        to: email,
        subject: "Welcome to SAPREM NGO - Staff Account Created",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to SAPREM NGO</h2>
            
            <p>Dear ${name},</p>
            
            <p>Your staff account has been successfully created. Welcome to the SAPREM NGO team!</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Your Account Details:</h3>
              <p><strong>Employee ID:</strong> ${employeeId}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><strong>Department:</strong> ${department}</p>
              <p><strong>Designation:</strong> ${designation}</p>
              ${project ? `<p><strong>Project:</strong> ${project}</p>` : ''}
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>Important:</strong> Please change your password after your first login for security purposes.
              </p>
            </div>
            
            <p>You can access the staff portal using the link below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_BASE_URL}/login" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Staff Portal
              </a>
            </div>
            
            <h3 style="color: #1e40af;">Getting Started:</h3>
            <ul>
              <li>Log in to your staff dashboard</li>
              <li>Complete your profile information</li>
              <li>Check your assigned tasks and villages</li>
              <li>Mark your daily attendance</li>
              <li>Submit daily work reports</li>
            </ul>
            
            <p>If you have any questions or need assistance, please contact your supervisor or the admin team.</p>
            
            <p>Best regards,<br/>
            <strong>SAPREM NGO Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `
      });

      console.log('✅ Welcome email sent to staff:', email);

      res.status(201).json({ 
        message: "Staff member created successfully and welcome email sent", 
        staff: await staff.populate('user assignedVillages supervisor'),
        credentials: {
          employeeId,
          email,
          password
        }
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // Still return success since staff was created successfully
      res.status(201).json({ 
        message: "Staff member created successfully. Email failed to send, but here are the credentials:", 
        staff: await staff.populate('user assignedVillages supervisor'),
        credentials: {
          employeeId,
          email,
          password
        },
        emailError: "Email notification failed - please provide credentials manually"
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all staff members
exports.getAllStaff = async (req, res) => {
  try {
    const { department, project, isActive } = req.query;
    const filter = {};
    
    if (department) filter.department = department;
    if (project) filter.project = project;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const staff = await Staff.find(filter)
      .populate('user', 'name email role')
      .populate('assignedVillages', 'name')
      .populate('supervisor', 'name designation')
      .sort({ createdAt: -1 });

    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get staff by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('assignedVillages', 'name')
      .populate('supervisor', 'name designation');

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update staff
exports.updateStaff = async (req, res) => {
  try {
    const { name, phone, department, designation, project, assignedVillages, supervisor, isActive, profilePhoto } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        department,
        designation,
        project,
        assignedVillages,
        supervisor,
        isActive,
        profilePhoto,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('user assignedVillages supervisor');

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({ message: "Staff updated successfully", staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Soft delete - mark as inactive
    staff.isActive = false;
    await staff.save();

    res.json({ message: "Staff member deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get staff by user ID
exports.getStaffByUserId = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id })
      .populate('user', 'name email role')
      .populate('assignedVillages', 'name')
      .populate('supervisor', 'name designation');

    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
