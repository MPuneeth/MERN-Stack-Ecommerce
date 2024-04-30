const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
//const{getResetPasswordToken} = require("../model/userModel");
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto");
const validator = require("validator");
//const Product = require("../models/productModel");
const cloudinary = require ("cloudinary");

//Register a User
exports.registerUser = catchAsyncErrors(async(req, res, next)=>{

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars", 
        width: 150,
        crop: "scale",
    });

    const{name, email, password} = req.body;

    const user = await User.create({
        name, email, password,
        avatar:{
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    })

    // const token = user.getJWTToken();

    // res.status(201).json({
    //     success:true,
    //     token,
    // })

    sendToken(user, 201, res);
})

// Login user

exports.loginUser = catchAsyncErrors(async(req, res, next)=>{

     const{email,password} = req.body;
     
     //Checking if user has given both email & password

     if(!email || !password){

        return next(new ErrorHandler("Please Enter Email & Password", 400));
     }

     const user = await User.findOne({email}).select("+password");

     if(!user){

        return next(new ErrorHandler("Invalid Email or Password", 401));
     }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    // const token = user.getJWTToken();

    // res.status(200).json({
    //     success:true,
    //     token,
    // })

    sendToken(user, 200, res);
})

//Logout User

exports.logout = catchAsyncErrors(async(req, res, next)=>{

    res.cookie("token", null, {
        expires:new Date(Date.now()),
        httpOnly:true
             
    })
        
       res.status(200).json({
        succes:true,
        message : "Logged out"
    })

})

// Forgot Password

exports.forgotPassword = catchAsyncErrors(async(req, res, next)=>{

    const user = await User.findOne({email:req.body.email});

    if(!user){

        return next(new ErrorHandler("User not found", 404));
    }

    //Get ResetPassword Token

    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false}); //To save the passowrd which we got
    
    //to create link // {req.protocol}://${req.get("host")}

    // This process.env.FRONTEND_URL was before when the frontend server was running in 
    //Port 3000, but now when it is running in 4000 as backend is MongoDB cloud now
    //so we have to change as 

   // const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`; 

   // Change as below
   
   const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`; 

    const message = `Your Password reset token is :- \n\n ${resetPasswordUrl} \n\n
    If you have not requested this email then please ignore`;

    try {
        
        await sendEmail({

            email:user.email,
            subject: `Ecommerce password recovery`,
            message,
        })

        res.status(200).json({

            success : true,
            message : `Email sent to ${user.email} successfully`
        })

    } catch (error) {

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save({validateBeforeSave: false});

        return next(new ErrorHandler(error.message, 500));
    }

})

// Reset Password

exports.resetPassword = catchAsyncErrors(async(req, res, next)=>{

    //creating token hash
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken, 
        resetPasswordExpire: {$gt: Date.now()}
    })

    if(!user){

        return next(new ErrorHandler("Reset Password token is invalid or has been expired", 404));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match", 404));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200,res);
})

//Get user details

exports.getUserDetails = catchAsyncErrors(async(req, res, next)=>{

  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success:true,
    user
  })
})
  //Update user Password

exports.UpdatePassword = catchAsyncErrors(async(req, res, next)=>{

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Old Password is Incorrect", 401));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match", 400));
    }
    
    user.password = req.body.newPassword;

    await user.save();

   sendToken(user,200,res);
    })

// //Update user Profile

// exports.updateProfile = catchAsyncErrors(async (req, res, next) => {

//     const newUserData = {
//         //user:req.user.id,
//         name: req.body.name,
//         email: req.body.email,
//     };

//     // if(!email||!name){
//     //     return next(new ErrorHandler("Please enter both name & email", 400))
//     // }
  
//    // we will add cloudinary later - 

//    if (req.body.avatar !== "") {
//     const user = await User.findById(req.user.id);

//     const imageId = user.avatar.public_id;

//     await cloudinary.v2.uploader.destroy(imageId);

//     const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//       folder: "avatars",
//       width: 150,
//       crop: "scale",
//     });

//     newUserData.avatar = {
//       public_id: myCloud.public_id,
//       url: myCloud.secure_url,
//     }
//   }


//   const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
//     new: true,
//     runValidators: true,
//     useFindAndModify: false,
//   });

//     // const{name,email} = req.body;

//     // const user = await User.findByIdAndUpdate(req.user.id, {name, email},{
//     //     new:true,
//     //     runValidators:true,
//     //     useFindAndModify:false
//     // })

//    res.status(200).json({
//     success:true,
// });
// });

// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {

    const newUserData = { 
        name: req.body.name,
        email: req.body.email,
    }
       
    if ( req.body.avatar !== undefined && req.body.avatar!== ""  ) {

      const user = await User.findById(req.user.id);
  
      const imageId = user.avatar.public_id;
        
      await cloudinary.v2.uploader.destroy(imageId);
            
      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
  
       newUserData.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  
    res.status(200).json({
      success: true,
    });
  });
  

    //Get all users (admin)
    exports.getAllUser = catchAsyncErrors(async (req, res, next) => {

         const users = await User.find();

         res.status(200).json({
            success:true, users
         })
    })

     //Get single user (admin)
    exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {

        const user = await User.findById(req.params.id);

        if(!user){
            return next(new ErrorHandler(`User does not exist with this id: ${req.params.id}`,400))
        }

        res.status(200).json({
           success:true, user
        })
   })

   //Update user Role - Admin

exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };

    //const{name,email,role} = req.body;

    //let user = User.findById(req.params.id);

    // if(!user){
    //     return next(new ErrorHandler(`User does not exist with this id: ${req.params.id}`,400))
    // }

      await User.findByIdAndUpdate(req.params.id, newUserData, {

        new: true, 
        runValidators: true, 
        useFindAndModify: false,
    });

   res.status(200).json({
    success:true,
    //message:"Parameters given are changed now"
});
    });

    // Delete user - Admin

exports.deleteUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    //we will remove cloudinary later - removed now

    if(!user){
        return next(new ErrorHandler(`User does not exist with this id: ${req.params.id}`))
    }

    const imageId = user.avatar.public_id;
        
    await cloudinary.v2.uploader.destroy(imageId);

    await user.deleteOne();
    

   res.status(200).json({
    success:true,
    message:"User deleted successfully"
});
    });

    