import React, { useState } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import styles from "../../styles/styles";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { RxAvatar } from 'react-icons/rx';
import LOGO from '../../Assests/SEMA-Favicon-Icon.png';
import { IoIosLock } from "react-icons/io";
const Signup = () => {

    const navigate = useNavigate()

    const [visible, setVisible] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        businessName: "",
        gstNumber: "",
        phoneNumber: "",
        businessType: "",
        password: "",
        confirmPassword: "",

    });
    const [banner, setBanner] = useState();
    const [profilePic, setProfilePic] = useState();
    const [check, setCheck] = useState(false);
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

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value


        }));
        // console.log(formData);
    }
    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        const { name } = e.target;
        console.log(name)
        if (name == "banner") {
            setBanner(file);
        }
        else {
            setProfilePic(file);
        }


    };
    //    console.log("checked :",check);
    return (
        <div className='min-h-screen bg-gradient-to-b from-customBlue to-customGreen flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md '>

                <div className="flex justify-center text-center  items-center   text-white">
                    <div className='flex justify-center shadow-2xl  rounded-full bg-white w-1/2'>
                        <button className='m-3 text-white bg-cyan-600 font-bold  px-4 py-2 rounded-3xl '>Log In</button>
                        <button className='m-3 text-white font-bold bg-cyan-600 px-4 py-2 rounded-3xl'>Sign Up</button>
                    </div>
                </div>
                <h2 className="flex justify-center text-center mt-6 mb-6 items-center text-3xl  text-white">
                    <IoIosLock /><span>Customer Signup</span>
                </h2>
            </div>
            <div className='mt-4 sm:mx-auto sm:w-full sm:max-w-[35rem] '>
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
                                    placeholder='First Name'
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
placeholder='Last Name'
                                    value={formData.lastName}
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
                                    placeholder='Phone Number'
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>
                        {/* Phone number end */}
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
placeholder='Email'
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
                                Institute Name <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="name"
                                    name='businessName'
                                    required
placeholder='Institute Name'
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
                               Institute Address: <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="text"
                                    name='gstNumber'
                                    required
placeholder='Address line 1'
                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                                 <input type="text"
                                    name='gstNumber'
                                    required
placeholder='Address line 2'

                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border mt-2 border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="name"
                                className='block text-sm font-medium text-gray-700'
                            >
                                ⁠⁠Landmark   <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="name"
                                    name='businessName'
                                    required
placeholder='Landmark'
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
                                ⁠⁠Pincode <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="name"
                                    name='businessName'
                                    required
placeholder='⁠Pincode'
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
                                District <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="name"
                                    name='businessName'
                                    required
placeholder='District'
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
                                ⁠⁠State <div className="inline text-red-700">*</div>
                            </label>
                            <div className='mt-1'>
                                <input type="name"
                                    name='businessName'
                                    required
                                    placeholder='⁠State'

                                    value={formData.businessName}
                                    onChange={handleChange}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
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
                                    placeholder='Password'
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
                                    placeholder='Confirm Password'
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
                                onChange={() => { setCheck((prev) => !prev) }}
                            />
                            <label htmlFor="checkbox" className="ml-2 text-sm text-gray-700">
                            By Checking this box I agree to the Terms and Conditions of SEMA Healthcare PVT. LTD.


                            </label>
                        </div>





                        <div>
                            <button
                                type='submit'
                                className=' className="group relative w-full h-[40px] flex justify-center py-2 px-4 border border-transparent text-md font-medium rounded-3xl  bg-yellow-600 text-black"'
                            >
                                SignUp
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

export default Signup;





