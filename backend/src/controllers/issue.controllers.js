import { Issue } from "../models/issueRaise.models.js";
import { User } from "../models/user.models.js";
import {sendEmail} from "../utils/emailService.js"
import { Response } from "../models/response.models.js";


const giveTime = () => {
    const currentTime = new Date();

    const day = String(currentTime.getDate()).padStart(2, '0');
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const year = currentTime.getFullYear();
    
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');

    const giveTime2 = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    
    return giveTime2
}

const createIssue = async (req,res)=>{
    try {
    const {issue,description,address,requireDepartment} = req.body

    const acknowledge_at = "";

   if (!issue || !description || !address || !requireDepartment) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    console.log('Looking for user with department ID:', requireDepartment);
    
    // Find a user with this department ID
    const availableUser = await User.findOne({ department: requireDepartment }).populate('department');

    if (!availableUser) {
        console.log('No user found with department ID:', requireDepartment);
        return res.status(401).json({ success: false, message: "Required Department is not available" });
    }
    
    console.log('Found user:', availableUser.fullName, 'Department:', availableUser.department);
    
    const task = await Issue.create({
        issue,
        description,
        address,
        requireDepartment,
        userId: req.user._id,
        acknowledge_at,
        createdAt : giveTime(),
        updatedAt : giveTime()
    })
    await task.save();

    
    // Send email to the user
    const subject = 'New Issue Assigned';
    const text = `Dear ${availableUser.fullName},

You have been assigned a new issue:

Issue: ${issue}
Description: ${description}
Address: ${address}

Please address this issue as soon as possible.

Thank you,
UAIMS HR`;

    // Attempt email notification; do not block issue creation if email fails
    try {
        await sendEmail(availableUser.email, subject, text);
    } catch (mailErr) {
        console.error("Email notification failed:", mailErr.message);
    }
 
    const response = await Response.create({ 
        issueId: task._id
    });
    await response.save();

    await req.user.addProblem(task._id);
    await req.user.addResponse(response._id);


    return res.status(201).json({ success: true, message: "Issue created successfully", task });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}


const getissue = async (req,res)=>{
    try {
    const dep = req.user.department
    
    const issues = await Issue.find({requireDepartment : dep, complete:false})
    
    return res.status(200).json({ success: true, data: issues })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}


const updateResponses = async (req, res) => {
    try {
    const { description, requirements, actionTaken, complete } = req.body;

    const dep = req.user.department;

    // Find the issues for the user's department
    const issues = await Issue.find({ requireDepartment: dep });

    // Check if any issues were found
    if (issues.length === 0) {
          return res.status(404).json({ success: false, message: "No issues found for this department" });
    }

    // Iterate over the issues to update responses
    let updatedResponses = [];
    for (let issue of issues) {
        const id = issue._id;

        // Find the response for the issue
        const response = await Response.findOne({ issueId: id });
        if (response) {
            const resid = response._id;

            // Update the response
            const updatedResponse = await Response.findByIdAndUpdate(
                resid,
                {
                    $set: {
                        description,
                        requirements,
                        actionTaken,
                        complete,
                    },
                },
                { new: true }
            );

            if (updatedResponse) {
                updatedResponses.push(updatedResponse);
            }
        }
    }

    if (updatedResponses.length === 0) {
        return res.status(404).json({ success: false, message: "No responses found to update" });
    }

    return res.status(200).json({ success: true, message: "Responses updated successfully", updatedResponses });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getIssueforuser = async (req,res)=>{
    try {
    const getuser = req.user._id
    const findproblems = await Issue.find({ userId: getuser, complete: false });
    

    return res.status(200).json({ success: true, data: findproblems })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}





const completeReport = async (req, res) => {
    try {
    const userId = req.user._id;
    const { issueId } = req.body; // Get the specific issueId from the request body or params
    // Find the specific issue created by the user
    const findProblem = await Issue.findOne({ _id: issueId, userId });

    if (!findProblem) {
      return res.status(404).json({ success: false, message: "No issue found with the provided ID for this user" });
    }   


    // Find all responses corresponding to the issue
    const findResponses = await Response.find({ issueId });

    // Update the specific issue
    await Issue.updateOne({ _id: issueId }, { complete: true,  updatedAt: giveTime() });

    // Update corresponding responses
    await Response.updateMany({ issueId }, { complete: true });

    return res.status(200).json({ success: true, message: "Issue and corresponding responses marked as complete", findProblem, findResponses });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};



const acknowledgeResponse = async (req, res) => {
    try {
    const userId = req.user._id;
    const { responseId } = req.body; // Get the specific responseId from the request body or params
    
    // Find the specific response by the user
    const findResponse = await Response.findOne({ issueId: responseId});

    if (!findResponse) {
      return res.status(404).json({ success: false, message: "No response found with the provided ID for this user" });
    }

    // Get current date and time for the acknowledgment
   
    
    await Issue.updateOne({ _id: responseId }, {acknowledge_at: giveTime()});

    // Update the response's acknowledgment time
    await Response.updateOne({ issueId: responseId }, { acknowledge_at: giveTime() });

    return res.status(200).json({ success: true, message: "Response acknowledged successfully", findResponse });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const sendReportToAdmin = async (req, res) => {
    try {
    const userId = req.user._id;

    // Find all issues created by the user
    const findProblems = await Issue.find({ userId:userId });


    // If no issues are found, return an appropriate message
    if (findProblems.length === 0) {
            return res.status(404).json({ success: false, message: "No issues found for this user" });
    }

    // Extract issue IDs
    const issueIds = findProblems.map(issue => issue._id);
    
    // Find all responses corresponding to the issues
    const findResponses = await Response.find({ issueId: { $in: issueIds } });

    return res.status(200).json({ success: true, message: "Summary sent successfully", findProblems, findResponses });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};




const fetchReport = async (req,res)=>{
    try {
    const completedProblems = await Issue.find();
    
    return res.status(200).json({ success: true, message: "Completed problems and responses fetched successfully", data: completedProblems });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

const getAdmin = async (req,res)=>{
    try {
    const getdep = req.user.department
          
    return res.status(200).json({ success: true, message: "Department is fetched successfully to users", getdep });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export {
    createIssue,
    getissue,
    getIssueforuser,
    updateResponses,
    completeReport,
    acknowledgeResponse,
    fetchReport,
    getAdmin,
}