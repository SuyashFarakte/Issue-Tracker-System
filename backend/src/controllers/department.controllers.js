import { Department } from "../models/department.models.js";

//add department to the database
const addDepartment = async (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        // Case-insensitive check for existing department
        const existingDepartment = await Department.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (existingDepartment) {
            return res.status(409).json({ success: false, message: "Department name already exists" });
        }

        const department = await Department.create({ name, type });
        return res.status(201).json({ 
            success: true, 
            message: "Department added successfully", 
            data: { ...department.toObject(), department_id: department._id } 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

//get all departments from the database
const getDepartments = async (req,res)=>{
    try {
        const departments = await Department.find();
        const formattedDepartments = departments.map(dep => ({
            ...dep.toObject(),
            department_id: dep._id // Map _id to department_id for frontend
        }));
        return res.status(200).json({ success: true, data: formattedDepartments });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};  

//delete a department
const deleteDepartment = async (req,res)=>{ 
    const { departmentId } = req.params;
    try {
        const department = await Department.findByIdAndDelete(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }
        return res.status(200).json({ success: true, message: "Department deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

//check department type

const checkDepartmentType = async (req,res)=>{
    const { name } = req.params;
    try {
        await connectDB;
        const department = await Department.findOne({ name });
        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }   
        return res.status(200).json({ success: true, message: "Department type fetched successfully", type: department.type });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};



//update department
const updateDepartment = async (req, res) => {
    const { departmentId } = req.params;
    const { name, type } = req.body;
    try {
        // Check if new name conflicts with another department
        if (name) {
            const conflict = await Department.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: departmentId }
            });
            if (conflict) {
                return res.status(409).json({ success: false, message: "Department name already exists" });
            }
        }

        const department = await Department.findByIdAndUpdate(
            departmentId,
            { name, type },
            { new: true, runValidators: true }
        );

        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }
        return res.status(200).json({ 
            success: true, 
            message: "Department updated successfully", 
            data: { ...department.toObject(), department_id: department._id } 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


//fetch maintainance department
const fetchMaintenanceDepartment = async (req,res)=>{
    try {   
        await connectDB;
        const getdep = await Department.findOne({ type: "maintenance" });
        if (!getdep) {
            return res.status(404).json({ success: false, message: "Maintenance department not found" });
        }   

        return res.status(200).json({ success: true, message: "Maintenance department fetched successfully", getdep });
    } 
    catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

//get public departments
const getPublicDepartments = async (req,res)=>{
    try {
        await connectDB;
        const departments = await Department.find({ type: "public" });
        if(!departments){
            return res.status(404).json({ success: false, message: "No public departments found" });
        }

        return res.status(200).json({ success: true, message: "Public departments fetched successfully", departments });
    }
     catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


//edit department details 

const editDepartment = async (req,res)=>{
    const { deptid } = req.params;
    const { name, type } = req.body;

    if (!name || !type) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        await connectDB;
        const department = await Department.findByIdAndUpdate(  deptid, { name, type }, { new: true });
        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        //if name is provided  check if it is different from the current name and not duplicate 
        const existingDepartment = await Department.findOne({ name });
        if (existingDepartment && existingDepartment._id.toString() !== deptid) {
            return res.status(409).json({ success: false, message: "Department name already exists" });
        }

        //build  update to query based on provided fields
        const updateFields = {};
        if (name) updateFields.name = name;
        if (type) updateFields.type = type;
        const updatedDepartment = await Department.findByIdAndUpdate(deptid, updateFields, { new: true });

        return res.status(200).json({ success: true, message: "Department updated successfully", department: updatedDepartment });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }   
};

export {
    addDepartment,
    getDepartments,
    deleteDepartment,
    checkDepartmentType,
    updateDepartment,
    fetchMaintenanceDepartment,
    getPublicDepartments,
    editDepartment
};
