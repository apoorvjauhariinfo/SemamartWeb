import React, { useState } from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// import { Editor } from 'primereact/editor';
import { Editor, EditorState } from 'draft-js';



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
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            reader.readAsDataURL(file);
        }
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
                            <label
                                htmlFor="ProductType"
                                className="block text-md font-medium text-gray-700"
                            >
                                Product Type
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
                        <div>
                            <label
                                htmlFor="category"
                                className="block text-md font-medium text-gray-700"
                            >
                                Category
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
                    <div className="w-full md:w-1/3 flex justify-center items-center">
                        <div className="flex flex-col items-center space-y-2">
                            <label
                                htmlFor="file-upload"
                                className="flex items-center justify-center w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                            >
                                {image ? (
                                    <img
                                        src={image}
                                        alt="Uploaded"
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="text-gray-500 text-center">
                                        <span className="text-4xl">☁️</span>
                                        <p className="text-sm mt-2">Upload a product cover image</p>
                                    </div>
                                )}
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>

                            {/* Small "+" Button */}
                            <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer">
                                <span className="text-gray-400 text-2xl font-semibold">+</span>
                            </div>
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
                <div className="mt-10 border rounded-lg p-6  max-w-full">
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
                    <div className="mb-4">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={isStockManagementEnabled}
                                onChange={(e) => setIsStockManagementEnabled(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Enable product stock management</span>
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={allowSingleQuantity}
                                onChange={(e) => setAllowSingleQuantity(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                                Allow only one quantity of this product to be bought in a single order
                            </span>
                        </label>
                    </div>
                </div>
                <div className="mt-2 border rounded-lg p-6  max-w-full">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Shipping and Tax</span>
                        <span className="text-sm text-gray-500">Manage shipping and tax for this product.</span>
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
                                <option value="Out of Stock">Out of Stock</option>
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
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="border rounded-lg p-6  max-w-full mt-5">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Attribute</span>
                        <span className="text-sm text-gray-500">Manage attributes for this simple product.</span>
                    </h2>
                    <div className="flex items-center  gap-4">
                        <select
                            value={selectedAttribute}
                            onChange={(e) => setSelectedAttribute(e.target.value)}
                            className="w-2/3 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Custom Attribute">Custom Attribute</option>
                            <option value="Size">Size</option>
                            <option value="Color">Color</option>
                            {/* Add more options as needed */}
                        </select>
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 focus:ring focus:ring-blue-500"
                        >
                            Add attribute
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:ring focus:ring-yellow-300"
                        >
                            Save attribute
                        </button>
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
                <div className="border rounded-lg p-6   max-w-full mt-5">
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
                <div className="border rounded-lg p-6   max-w-full mt-5">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Min/Max Options</span>
                        <span className="text-sm text-gray-500">Manage min max options for this product</span>
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
                                    Enable Min Max Rule for this product
                                </span>
                            </label>
                        </div>
                    </div>


                </div>
                <div className="border rounded-lg p-6  mt-5 max-w-full">
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <span className="mr-2 text-gray-700">Other Options</span>
                        <span className="text-sm text-gray-500">Set your extra product options</span>
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="product-status" className="block text-sm font-medium text-gray-700 mb-2">
                                Product Status
                            </label>
                            <select
                                id="product-status"
                                value={productStatus}
                                onChange={(e) => setProductStatus(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Pending Review">Pending Review</option>
                                <option value="Published">Published</option>
                                <option value="Draft">Draft</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                                Visibility
                            </label>
                            <select
                                id="visibility"
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Visible">Visible</option>
                                <option value="Hidden">Hidden</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="purchase-note" className="block text-sm font-medium text-gray-700 mb-2">
                            Purchase Note
                        </label>
                        <textarea
                            id="purchase-note"
                            value={purchaseNote}
                            onChange={(e) => setPurchaseNote(e.target.value)}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Customer will get this info in their order email"
                            rows="3"
                        ></textarea>
                    </div>
                    <div className="mb-4">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={enableReviews}
                                onChange={(e) => setEnableReviews(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Enable product reviews</span>
                        </label>
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