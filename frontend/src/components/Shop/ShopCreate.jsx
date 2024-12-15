import React, { useState } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import styles from "../../styles/styles";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { RxAvatar } from 'react-icons/rx';
import LOGO from '../../Assests/SEMA-Favicon-Icon.png';

const ShopCreate = () => {

    const navigate = useNavigate()
    
    const [visible, setVisible] = useState(false);
    const [formData,setFormData] = useState({
        firstName:"",
        lastName:"",
        email:"",
        businessName:"",
        gstNumber:"",
        phoneNumber:"",
        businessType:"",
        password:"",
        confirmPassword:"",

    });
    const [banner,setBanner] = useState();
    const [profilePic,setProfilePic] = useState();
    const [check,setCheck] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submission started");
        if (!check) {
            return window.alert("Checkbox is compulsory");
        }
        if (formData.password !== formData.confirmPassword) {
            return window.alert("Passwords do not match");
        }
        if (passwordErrors.length > 0) {
            return window.alert("Please fix the password issues.");
          }
        console.log("Form validation passed");
    
        const newForm = new FormData();
        newForm.append("firstName", formData.firstName);
        newForm.append("lastName", formData.lastName);
        newForm.append("email", formData.email);
        newForm.append("businessName", formData.businessName);
        newForm.append("gstNumber", formData.gstNumber);
        newForm.append("phoneNumber", formData.phoneNumber);
        newForm.append("businessType", formData.businessType);
        newForm.append("password", formData.password);
        newForm.append("banner", banner);
        newForm.append("profilePic", profilePic);
    
        console.log("Form data prepared");
    
        try {
            const res = await axios.post(`${server}/shop/create-shop`, newForm, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log("API response:", res.data);
            toast.success(res.data.message);
            navigate("/shop-login");
        } catch (error) {
            console.error("API error:", error);
            toast.error(error.response?.data?.message || "An error occurred");
        }
    };
    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) {
          errors.push("Password must be at least 8 characters long.");
        }
        if (!/[A-Z]/.test(password)) {
          errors.push("Password must include at least one uppercase letter.");
        }
        if (!/[a-z]/.test(password)) {
          errors.push("Password must include at least one lowercase letter.");
        }
        if (!/[0-9]/.test(password)) {
          errors.push("Password must include at least one number.");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          errors.push("Password must include at least one special character.");
        }
        return errors;
      };
      const handlePasswordChange = (e) => {
        const password = e.target.value;
        const errors = validatePassword(password);
        setPasswordErrors(errors);
        setFormData((prev) => ({
          ...prev,
          password,
        }));
      };
    
    const handleChange = (event) =>{
        const {name,value} = event.target;
        setFormData((prev)=>({
            ...prev,
            [name]:value
            
            
        }));
        // console.log(formData);
    }
    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        const {name} = e.target;
        console.log(name)
        if(name=="banner")
        {
            setBanner(file);
        }
        else{
            setProfilePic(file);
        }
        
        
    };
//    console.log("checked :",check);
    return (
        <div className='min-h-screen bg-gradient-to-b from-customBlue to-customGreen flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md '>
                <img
                    src={LOGO}
                    alt="SEMA Favicon Icon"
                    className="mt-1 mx-auto h-32 w-32 "
                />

                <h2 className="mt-6 mb-6 text-center text-4xl font-bold text-white">
                    Seller Registration
                </h2>
            </div>
            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-[35rem] '>
                <div className="bg-white bg-opacity-30 py-8 px-4 shadow sm:rounded-3xl sm:px-10">
                    <form className='space-y-6' onSubmit={handleSubmit} >
                        {/* Shop Name */}
                        <div>
                            <label htmlFor="name"
                                className='block text-sm font-medium text-gray-700 '
                            >
                                First Name <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1 '>
                                <input type="name"
                                    name='firstName'
                                    required

                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="name"
                                className='block text-sm font-medium text-gray-700'
                            >
                                Last Name <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="name"
                                    name='lastName'
                                    required

                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="name"
                                className='block text-sm font-medium text-gray-700'
                            >
                                Email Address <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="email"
                                    name='email'
                                    required

                                    value={formData.email}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>


                        <div>
                            <label htmlFor="name"
                                className='block text-sm font-medium text-gray-700'
                            >
                                Business Name <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="name"
                                    name='businessName'
                                    required

                                    value={formData.businessName}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="name"
                                className='block text-sm font-medium text-gray-700'
                            >
                                GST Number <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="text"
                                    name='gstNumber'
                                    required

                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>



                        {/* Phon number */}
                        <div>
                            <label htmlFor="password"
                                className='block text-sm font-medium text-gray-700'
                            >
                                Phone Number<div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1 relative'>
                                <input
                                    type="number"
                                    name='phoneNumber'
                                    autoComplete='password'
                                    required
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>
                        {/* Phone number end */}

                        {/* Email start */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Select Your Business categories <div className="inline text-red-700">*</div>
                            </label>
                            <div className="relative mt-1">
                                <select
                                    name="businessType"
                                    required
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                >
                                    <option value="" disabled>Select an option</option>
                                    <option value="Distributor">Distributor</option>
                                    <option value="Manufacturer">Manufacturer</option>
                                    <option value="Reseller">Reseller</option>
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>


                        </div>

                        <div className=" ">
                            <label
                                htmlFor="avatar"
                                className="block text-sm font-medium text-gray-700"
                            >Upload Profile Picture<div className="inline text-red-700">*</div></label>
                           
                            <div className=" flex items-center border border-gray-300 rounded-3xl">
                                <span className="inline-block h-8 w-8 rounded-full overflow-hidden">
                                    {profilePic ? (
                                        <img
                                            src={URL.createObjectURL(profilePic)}
                                            alt="profilePic"
                                            className="h-full w-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <RxAvatar className="h-8 w-8" />
                                    )}
                                </span>
                                <label
                                    htmlFor="file-input"
                                    className="ml-5 flex items-center justify-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-gray-700 "
                                >
                                    {/* <span>Upload</span> */}
                                    <input
                                        type="file"
                                        name="profile"
                                        id="file-input"
                                        required
                                        onChange={handleFileInputChange}
                                        className="" 
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="">
                            <label
                                htmlFor="avatar"
                                className="block text-sm font-medium text-gray-700"
                            >Upload Banner</label>
                            <div className=" flex items-center border rounded-3xl border-gray-300">
                                <span className="inline-block h-8 w-8 rounded-full overflow-hidden">
                                    {banner ? (
                                        <img
                                            src={URL.createObjectURL(banner)}
                                            alt="banner"
                                            className="h-full w-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <RxAvatar className="h-8 w-8" />
                                    )}
                                </span>
                                <label
                                    htmlFor="file-input"
                                    className="ml-5 flex items-center justify-center px-4 py-2   rounded-md shadow-sm text-sm font-medium text-gray-700 "
                                >
                                    {/* <span>Upload</span> */}
                                    <input
                                        type="file"
                                        name="banner"
                                        id="file-input"
                                        onChange={handleFileInputChange}
                                        // className="sr-only"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password <span className="text-red-700">*</span>
            </label>
            <div className="mt-1 relative">
              <input
                type={visible ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handlePasswordChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {visible ? (
                <AiOutlineEye
                  className="absolute right-2 top-2 cursor-pointer"
                  size={25}
                  onClick={() => setVisible(false)}
                />
              ) : (
                <AiOutlineEyeInvisible
                  className="absolute right-2 top-2 cursor-pointer"
                  size={25}
                  onClick={() => setVisible(true)}
                />
              )}
            </div>
            {/* Password Error Messages */}
            {passwordErrors.length > 0 && (
              <ul className="mt-2 text-sm text-red-600">
                {passwordErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Confirm Password<div className="inline text-red-700">*</div>
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    type={visible ? "text" : "password"}
                                    name="confirmPassword"
                                    autoComplete="current-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {visible ? (
                                    <AiOutlineEye
                                        className="absolute right-2 top-2 cursor-pointer"
                                        size={25}
                                        onClick={() => setVisible(false)}
                                    />
                                ) : (
                                    <AiOutlineEyeInvisible
                                        className="absolute right-2 top-2 cursor-pointer"
                                        size={25}
                                        onClick={() => setVisible(true)}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center mt-4">
                            <input
                                type="checkbox"
                                id="checkbox"
                                name="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                onChange={()=>{setCheck((prev)=>!prev)}}
                            />
                            <label htmlFor="checkbox" className="ml-2 text-sm text-gray-700">
                                I agree to allow SEMA Healthcare Pvt. Ltd. to charge platform fees as per industry standards.


                            </label>
                        </div>  





                        <div>
                            <button
                                type='submit'
                                className=' className="group relative w-full h-[40px] flex justify-center py-2 px-4 border border-transparent text-md font-medium rounded-3xl  bg-yellow-600 text-black"'
                            >
                                Register
                            </button>
                        </div>
                        

                        {/* <div className={`${styles.noramlFlex} w-full`} >
                            <h4>Already have an account?</h4>
                            <Link to="/shop-login" className="text-blue-600 pl-2">
                                Sign In
                            </Link>
                        </div> */}  

                    </form>
                </div>
            </div>
        </div>
    )
}

export default ShopCreate





