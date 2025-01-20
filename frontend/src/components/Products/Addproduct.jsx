import React, { useState } from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';



const Addproduct = () => {
    const [tags, setTags] = useState([]);
    const [input, setInput] = useState("");
    const [image, setImage] = useState(null);
    const [isStockManagementEnabled, setIsStockManagementEnabled] = useState(false);
    const [allowSingleQuantity, setAllowSingleQuantity] = useState(false);
    const [stockStatus, setStockStatus] = useState("In Stock");
    const [selectedAttribute, setSelectedAttribute] = useState("Custom Attribute");
    const [productStatus, setProductStatus] = useState("Pending Review");
    const [visibility, setVisibility] = useState("Visible");
    const [purchaseNote, setPurchaseNote] = useState("");
    const [enableReviews, setEnableReviews] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
    })

    const [preview, setPreview] = useState(null);
    const [previewType, setPreviewType] = useState(null);
    const [thumbnails, setThumbnails] = useState([]);
    // const [allowSingleQuantity, setAllowSingleQuantity] = useState(false);

    // State for Manufacturer Details
    const [manufacturerName, setManufacturerName] = useState("");
    const [customerCareEmail, setCustomerCareEmail] = useState("");
    const [customerCareNumber, setCustomerCareNumber] = useState("");
    const [countryOfOrigin, setCountryOfOrigin] = useState("");

    // Function to handle saving the data

    const [rows, setRows] = useState([
        { label: "Date of Manufacture", type: "date", value: "" },
        { label: "Date of Expire", type: "date", value: "" },
        // { label: "Product Name", type: "text", value: "" },
    ]);

    const addRow = (event) => {
        event.preventDefault();
        setRows([...rows, { label: "", type: "text", value: "" }]);
    };



    const handleLabelChange = (index, value) => {
        const updatedRows = rows.map((row, i) =>
            i === index ? { ...row, label: value } : row
        );
        setRows(updatedRows);
    };


    const handleSave = () => {
        const data = {
            allowSingleQuantity,
            manufacturerDetails: {
                manufacturerName,
                customerCareEmail,
                customerCareNumber,
                countryOfOrigin,
            },
        };

        // Example save logic (can replace with API call or other logic
    };
    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            setPreviewType("video");
            setThumbnails([...thumbnails, { url, type: "video" }]);
        }
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            setPreviewType("image");
            setThumbnails([...thumbnails, { url, type: "image" }]);
        }
    };

    const handleMultipleMediaUpload = (event) => {
        const files = Array.from(event.target.files);
        const newMedia = files.map((file) => {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith("video") ? "video" : "image";
            return { url, type };
        });
        setThumbnails([...thumbnails, ...newMedia]);
        if (newMedia.length > 0) {
            setPreview(newMedia[0].url);
            setPreviewType(newMedia[0].type);
        }
    };

    const setPreviewAndType = (url, type) => {
        setPreview(url);
        setPreviewType(type);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && input.trim()) {
            e.preventDefault();
            if (!tags.includes(input.trim())) {
                setTags([...tags, input.trim()]);
            }
            setInput(""); // Clear input field
        }
    };

    const removeTag = (indexToRemove) => {
        setTags(tags.filter((_, index) => index !== indexToRemove));
    };
    return (
        <div className="p-3">
            <h1 className="font-bold text-2xl">Add New Product</h1>
            <  hr />
            <form action="">
                <div className="flex flex-wrap md:flex-nowrap ">
                    <div className="w-full md:w-2/3 pr-4">
                        <div>
                            <label htmlFor="productName"
                                className='block text-md font-medium text-gray-500'
                            >
                                Title
                            </label>
                            <div className='mt-1 relative'>
                                <input
                                    type="text"
                                    id="productName"
                                    name='productName'
                                    autoComplete='productName'
                                    required

                                    placeholder='Product Name..'
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="productName"
                                className='block text-md font-medium text-gray-500'
                            >
                                HSN Code
                            </label>
                            <div className='mt-1 relative'>
                                <input
                                    type="text"
                                    id="productName"
                                    name='productName'
                                    autoComplete='productName'
                                    required

                                    placeholder='HSN Code'
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="ProductType"
                                className="block text-md font-medium text-gray-700"
                            >
                                Catergory
                            </label>
                            <div className="relative mt-1">
                                <select
                                    name="ProductType"
                                    required
                                    id="ProductType"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                >
                                    <option value="" disabled>Select an option</option>
                                    <option value="Distributor">Simple</option>
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

                        <div>
                            <label
                                htmlFor="category"
                                className="block text-md font-medium text-gray-700"
                            >
                                Sub Category
                            </label>
                            <div className="relative mt-1">
                                <select
                                    name="category"
                                    required
                                    id="category"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                >
                                    <option value="" disabled>Select an option</option>
                                    <option value="Distributor">Simple</option>
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
                        {/* Price & Discounted Price */}
                        <div className="flex flex-col md:flex-row md:space-x-6">
                            {/* Price */}
                            <div className="flex flex-col w-full">
                                <label className="text-gray-700 font-medium" htmlFor="price">
                                    Price
                                </label>
                                <div className="flex items-center border rounded-md p-2 mt-1">
                                    <span className="mr-1 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        id="price"
                                        placeholder="0.00"
                                        className="w-full focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Discounted Price */}
                            <div className="flex flex-col w-full mt-4 md:mt-0">
                                <label className="text-gray-700 font-medium" htmlFor="discountedPrice">
                                    Discounted Price
                                </label>
                                <div className="flex items-center border rounded-md p-2 mt-1">
                                    <span className="mr-1 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        id="discountedPrice"
                                        placeholder="0.00"
                                        className="w-full focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="tags" className="text-gray-700 font-medium">
                                Tags
                            </label>
                            <div className="border rounded-md p-2 flex flex-wrap items-center gap-2">
                                {tags.map((tag, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center bg-blue-200 text-blue-700 rounded px-2 py-1"
                                    >
                                        <span>{tag}</span>
                                        <button
                                            onClick={() => removeTag(index)}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <input
                                    id="tags"
                                    type="text"
                                    placeholder="Select tags/Add tags"
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className="focus:outline-none flex-1 min-w-[120px]"
                                />
                            </div>
                        </div>

                    </div>
                    <div className="w-full md:w-2/3 flex flex-col items-center space-y-4">
                        {/* Preview Section */}
                        <div className="w-3/6 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            {preview ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    {previewType === "video" ? (
                                        <video
                                            src={preview}
                                            controls
                                            className="w-full h-full object-contain rounded-lg"
                                        ></video>
                                    ) : (
                                        <img
                                            src={preview}
                                            alt="Uploaded"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-center">
                                    <span className="text-4xl">☁️</span>
                                    <p className="text-sm mt-2">Upload a media file</p>
                                </div>
                            )}
                        </div>

                        {/* Buttons Section */}
                        <div className="flex space-x-4">
                            {/* Upload Video */}
                            <button
                                onClick={() => document.getElementById("video-upload").click()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Upload Video
                            </button>
                            <input
                                id="video-upload"
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleVideoUpload}
                            />

                            {/* Upload Image */}
                            <button
                                onClick={() => document.getElementById("image-upload").click()}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                Upload Cover Image
                            </button>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />

                            {/* Upload Multiple Images */}
                            <button
                                onClick={() => document.getElementById("multiple-images-upload").click()}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                            >
                                Upload Images
                            </button>
                            <input
                                id="multiple-images-upload"
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={handleMultipleMediaUpload}
                            />
                        </div>

                        {/* Thumbnails Section */}
                        <div className="flex space-x-2 mt-4 overflow-x-auto">
                            {thumbnails.map((media, index) => (
                                <div
                                    key={index}
                                    className="w-20 h-20 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500"
                                    onClick={() => setPreviewAndType(media.url, media.type)}
                                >
                                    {media.type === "video" ? (
                                        <video
                                            src={media.url}
                                            className="w-full h-full object-cover rounded-lg"
                                            muted
                                        ></video>
                                    ) : (
                                        <img
                                            src={media.url}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
                <div className="w-full  ">
                    <div>
                        <label htmlFor="productName"
                            className='block text-md font-medium text-gray-500'
                        >
                            Short Description
                        </label>
                        <div className='mt-1 relative'>
                            <ReactQuill

                                id="productName"
                                name='productName'

                                className='appearance-none block w-full  py-2  rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-52'
                            />
                        </div>
                    </div>
                </div>
                {/* <   style={{ height: '320px' }}/> */}
                <div className="w-full  mt-10">
                    <div>
                        <label htmlFor=""
                            className='block text-md font-medium text-gray-500'
                        >
                            Description
                        </label>
                        <div className='mt-1 relative'>
                            <ReactQuill

                                id="productName"
                                name='productName'

                                className='appearance-none block w-full  py-2  rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-52'
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-10  max-w-full ">

                    <table className="table-auto w-full border-collapse border border-gray-300">
                        <label className="block text-xl font-medium text-gray-700 mb-1 n p-3">
                            Product Summary
                        </label>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={index}>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            value={row.label}
                                            onChange={(e) => handleLabelChange(index, e.target.value)}
                                            placeholder="Enter label"
                                        />
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <input
                                            type={row.type}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            value={row.value}
                                            onChange={(e) => handleInputChange(index, e.target.value)}
                                            placeholder="Enter value"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        onClick={addRow}
                        className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                    >
                        Custom
                    </button>
                </div>
                <div className="mt-10 border rounded-lg p-6   max-w-full ">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">RMA Options</span>
                        <span className="text-sm text-gray-500">set your return and warranty settings for override global settings.</span>
                    </h2>
                    <div className="flex items-center  gap-4">
                        <div className="mb-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={allowSingleQuantity}
                                    onChange={(e) => setAllowSingleQuantity(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    Override your default RMA settings for this product
                                </span>
                            </label>
                        </div>
                    </div>


                </div>
                <div className="mt-5     border rounded-lg p-6 max-w-full">

                    {/* Manufacturer Details Section */}
                    <div className="mt-1">
                        <h2 className="text-lg font-semibold flex items-center mb-4">
                            <span className="mr-2 text-gray-700">Manufacturer Details </span>

                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name of Manufacturer/Marketer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name of Manufacturer/Marketer
                                </label>
                                <input
                                    type="text"
                                    value={manufacturerName}
                                    onChange={(e) => setManufacturerName(e.target.value)}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                    placeholder="Enter name of manufacturer/marketer"
                                />
                            </div>

                            {/* Customer Care Email ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Care Email ID
                                </label>
                                <input
                                    type="email"
                                    value={customerCareEmail}
                                    onChange={(e) => setCustomerCareEmail(e.target.value)}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                    placeholder="Enter customer care email ID"
                                />
                            </div>

                            {/* Customer Care Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Care Number
                                </label>
                                <input
                                    type="tel"
                                    value={customerCareNumber}
                                    onChange={(e) => setCustomerCareNumber(e.target.value)}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                    placeholder="Enter customer care number"
                                />
                            </div>

                            {/* Country of Origin */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Country of Origin
                                </label>
                                <input
                                    type="text"
                                    value={countryOfOrigin}
                                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                    placeholder="Enter country of origin"
                                />
                            </div>
                        </div>
                    </div>


                </div>
                <div className="mt-5 border rounded-lg p-6  max-w-full">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Inventory</span>
                        <span className="text-sm text-gray-500">Manage inventory for this product.</span>
                    </h2>
                    <div className="flex justify-center items-center">
                        <div className="mb-4 w-full m-2">
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                                SKU (Stock Keeping Unit)
                            </label>
                            <input
                                type="text"
                                id="sku"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter SKU"
                            />
                        </div>
                        <div className="mb-4  w-full m-2">
                            <label htmlFor="stock-status" className="block text-sm font-medium text-gray-700 mb-2">
                                Stock Status
                            </label>
                            <select
                                id="stock-status"
                                value={stockStatus}
                                onChange={(e) => setStockStatus(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="In Stock">In Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-center items-center">
                        <div className="mb-4 w-full m-2">
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                                Net Quantity:
                            </label>
                            <input
                                type="text"
                                id="sku"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Net Quantity"
                            />
                        </div>
                        <div className="mb-4 w-full m-2">
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                                Ordering value:
                            </label>
                            <input
                                type="text"
                                id="sku"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder=" Min. quantity/Only 1 product per order.  "
                            />
                        </div>

                    </div>
                </div>
                <div className="mt-2 border rounded-lg p-6  max-w-full">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Tax Detail</span>
                        <span className="text-sm text-gray-500">Manage tax detail for this product.</span>
                    </h2>
                    <div className="flex justify-center items-center">

                        <div className="mb-4  w-full m-2">
                            <label htmlFor="stock-status" className="block text-sm font-medium text-gray-700 mb-2">
                                Tax Status
                            </label>
                            <select
                                id="stock-status"
                                value={stockStatus}
                                onChange={(e) => setStockStatus(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="In Stock">Taxable</option>
                                <option value="Out of Stock">Non-Taxable</option>
                            </select>
                        </div>
                        <div className="mb-4  w-full m-2">
                            <label htmlFor="stock-status" className="block text-sm font-medium text-gray-700 mb-2">
                                Tax class
                            </label>
                            <select
                                id="stock-status"
                                value={stockStatus}
                                onChange={(e) => setStockStatus(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="In Stock">standard</option>
                                <option value="Out of Stock">GST 5%</option>
                                <option value="Out of Stock">GST 10%</option>
                                <option value="Out of Stock">GST 12%</option>
                                <option value="Out of Stock">GST 18%</option>
                                <option value="Out of Stock">GST 20%</option>
                                <option value="Out of Stock">GST 28%</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-5 border rounded-lg p-6  max-w-full">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Shipping Details</span>
                        <span className="text-sm text-gray-500">Manage Shipping Details for this product.</span>
                    </h2>
                    <div className="flex justify-center items-center">
                        <div className="mb-4  w-full m-2">
                            <label htmlFor="stock-status" className="block text-sm font-medium text-gray-700 mb-2">
                                Weight Matric
                            </label>
                            <select
                                id="stock-status"
                                value={stockStatus}
                                onChange={(e) => setStockStatus(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Grams">In Stock</option>
                                <option value="Kilo Grams">Out of Stock</option>
                            </select>
                        </div>
                        <div className="mb-4  w-full m-2">
                            <label htmlFor="stock-status" className="block text-sm font-medium text-gray-700 mb-2">
                                Measurement Matric
                            </label>
                            <select
                                id="stock-status"
                                value={stockStatus}
                                onChange={(e) => setStockStatus(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="CM">In Stock</option>
                                <option value="Meter">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-center items-center">
                        <div className="mb-4 w-full m-2">
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                                Weight
                            </label>
                            <input
                                type="text"
                                id="sku"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Weight"
                            />
                        </div>
                        <div className="mb-4 w-full m-2">
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                                Measurement
                            </label>
                            <input
                                type="text"
                                id="sku"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Measurement"
                            />
                        </div>

                    </div>
                </div>




                <div className="border rounded-lg p-6   max-w-full mt-5">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Discount Options</span>
                        <span className="text-sm text-gray-500">set your discout for this product.</span>
                    </h2>
                    <div className="flex items-center  gap-4">
                        <div className="mb-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={allowSingleQuantity}
                                    onChange={(e) => setAllowSingleQuantity(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    Enable Bulk Discount
                                </span>
                            </label>
                        </div>
                    </div>


                </div>

                <div className="border rounded-lg p-6  mt-5 max-w-full">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Linked Products</span>
                        
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="product-status" className="block text-sm font-medium text-gray-700 mb-2">
                            Upsells 
                            </label>
                            <input
                                type="text"
                                id="sku"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Upsells"
                            />
                        </div>
                        <div>
                            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                            Cross-sells 
                            </label>
                            <input
                                type="text"
                                id="sku"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Cross-sells"
                            />
                        </div>
                    </div>
                    
                </div>
                <div className="flex justify-end">
                    <button
                        type="button"
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:ring focus:ring-yellow-300 mt-5"
                    >
                        Save Product
                    </button>
                </div>
            </form>

        </div>
    )
};


export default Addproduct;