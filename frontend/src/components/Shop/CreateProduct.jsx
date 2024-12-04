import React, { useEffect, useState } from "react";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../redux/actions/product";
import { categoriesData } from "../../static/data";
import { toast } from "react-toastify";

const CreateProduct = () => {
    const { seller } = useSelector((state) => state.seller);
    const { success, error } = useSelector((state) => state.products);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [images, setImages] = useState([]);
    const [name, setName] = useState("");
    const [shortdescription, setShortDescription] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [originalPrice, setOriginalPrice] = useState();
    const [discountPrice, setDiscountPrice] = useState();
    const [stock, setStock] = useState();
    const [productType, setProductType] = useState("");
    const [sku, setSku] = useState("");
    const [stockStatus, setStockStatus] = useState("In Stock");
    const [enableStockManagement, setEnableStockManagement] = useState(false);
    const [allowSingleQuantity, setAllowSingleQuantity] = useState(false);
    const [taxStatus, setTaxStatus] = useState("Taxable");
const [taxClass, setTaxClass] = useState("Standard");




    useEffect(() => {
        if (error) {
            toast.error(error);
        }
        if (success) {
            toast.success("Product created successfully!");
            navigate("/dashboard");
            window.location.reload();
        }
    }, [dispatch, error, success]);

    const handleImageChange = (e) => {
        e.preventDefault();

        let files = Array.from(e.target.files);
        setImages((prevImages) => [...prevImages, ...files]);
    };

    console.log(images);

    const handleSubmit = (e) => {
        e.preventDefault();

        const newForm = new FormData();

        images.forEach((image) => {
            newForm.append("images", image);
        });
        newForm.append("name", name);
        newForm.append("description", description);
        newForm.append("category", category);
        newForm.append("tags", tags);
        newForm.append("originalPrice", originalPrice);
        newForm.append("discountPrice", discountPrice);
        newForm.append("stock", stock);
        newForm.append("shopId", seller._id);
        dispatch(createProduct(newForm));
    };

    return (
        <div className="w-[90%] 800px:w-[50%] bg-white  shadow h-[80vh] rounded-[4px] p-3 overflow-y-scroll">
            <h5 className="text-[30px] font-Poppins text-center">Create Product</h5>
            {/* create product form */}
            <form onSubmit={handleSubmit}>
                <br />
                <div>
                    <label className="pb-2">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={name}
                        className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your product name..."
                    />
                </div>
                <br />
                <div>
                    <label className="pb-2">
                        Product Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        className="w-full mt-2 border h-[35px] rounded-[5px]"
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                    >
                        <option value="">Select Product Type</option>
                        <option value="Simple">Simple</option>
                        <option value="Complex">Complex</option>
                    </select>
                </div>
                <br />
                <div className="flex justify-between gap-4">
                    <div className="w-1/2">
                        <label className="pb-2">Original Price</label>
                        <input
                            type="number"
                            name="price"
                            value={originalPrice}
                            className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            onChange={(e) => setOriginalPrice(e.target.value)}
                            placeholder="Enter your product price..."
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="pb-2">
                            Price (With Discount) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="discountPrice"
                            value={discountPrice}
                            className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            onChange={(e) => setDiscountPrice(e.target.value)}
                            placeholder="Enter your product price with discount..."
                        />
                    </div>
                </div>
                <br />
                <div>
                    <label className="pb-2">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        className="w-full mt-2 border h-[35px] rounded-[5px]"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="Choose a category">Choose a category</option>
                        {categoriesData &&
                            categoriesData.map((i) => (
                                <option value={i.title} key={i.title}>
                                    {i.title}
                                </option>
                            ))}
                    </select>
                </div>
                <br />
                <div>
                    <label className="pb-2">Tags</label>
                    <input
                        type="text"
                        name="tags"
                        value={tags}
                        className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Enter your product tags..."
                    />
                </div>
                <br />
                <div>
                    <label className="pb-2">
                        Short Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        cols="30"
                        required
                        rows="3"
                        type="text"
                        name="description"
                        value={shortdescription}
                        className="mt-2 appearance-none block w-full pt-2 px-3 border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter your product description..."
                    ></textarea>
                </div>

                <br />


                <div>
                    <label className="pb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        cols="30"
                        required
                        rows="8"
                        type="text"
                        name="description"
                        value={description}
                        className="mt-2 appearance-none block w-full pt-2 px-3 border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter your product description..."
                    ></textarea>
                </div>

                <br />
                <div>
                    <label className="pb-2 font-bold">INVENTORY (Manage inventory for this product)</label>
                    <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
                        {/* Row 1 */}
                        <div className="flex justify-between gap-4">
                            {/* Column 1 - SKU */}
                            <div className="w-1/2">
                                <label className="pb-2">SKU (Stock Keeping Unit)</label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={sku} // Add a state variable for SKU
                                    className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    onChange={(e) => setSku(e.target.value)} // Add corresponding state handler
                                    placeholder="Enter SKU..."
                                />
                            </div>
                            {/* Column 2 - Stock Status */}
                            <div className="w-1/2">
                                <label className="pb-2">Stock Status</label>
                                <select
                                    className="w-full mt-2 border h-[35px] rounded-[5px]"
                                    value={stockStatus} // Add a state variable for stock status
                                    onChange={(e) => setStockStatus(e.target.value)} // Add corresponding state handler
                                >
                                    <option value="In Stock">In Stock</option>
                                    <option value="Stock Out">Stock Out</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2 - Enable Stock Management */}
                        <div className="mt-4">
                            <input
                                type="checkbox"
                                id="enable-stock-management"
                                checked={enableStockManagement} // Add a state variable for enabling stock management
                                onChange={(e) => setEnableStockManagement(e.target.checked)} // Add corresponding state handler
                            />
                            <label htmlFor="enable-stock-management" className="pl-2">
                                Enable product stock management
                            </label>
                        </div>

                        {/* Row 3 - Allow Only One Quantity */}
                        <div className="mt-4">
                            <input
                                type="checkbox"
                                id="allow-single-quantity"
                                checked={allowSingleQuantity} // Add a state variable for single quantity allowance
                                onChange={(e) => setAllowSingleQuantity(e.target.checked)} // Add corresponding state handler
                            />
                            <label htmlFor="allow-single-quantity" className="pl-2">
                                Allow only one quantity of this product to be bought in a single order
                            </label>
                        </div>
                    </div>
                </div>
                <br />
                {/* SHIPPING AND TAX Section */}
    <label className="pb-2 font-bold mt-6 block">SHIPPING AND TAX (Manage shipping and tax for this product)</label>
    <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
        {/* Row 1 */}
        <div className="flex justify-between gap-4">
            {/* Column 1 - Tax Status */}
            <div className="w-1/2">
                <label className="pb-2">Tax Status</label>
                <select
                    className="w-full mt-2 border h-[35px] rounded-[5px]"
                    value={taxStatus} // Add a state variable for tax status
                    onChange={(e) => setTaxStatus(e.target.value)} // Add corresponding state handler
                >
                    <option value="Taxable">Taxable</option>
                    <option value="Not Taxable">Not Taxable</option>
                </select>
            </div>

            {/* Column 2 - Tax Class */}
            <div className="w-1/2">
                <label className="pb-2">Tax Class</label>
                <select
                    className="w-full mt-2 border h-[35px] rounded-[5px]"
                    value={taxClass} // Add a state variable for tax class
                    onChange={(e) => setTaxClass(e.target.value)} // Add corresponding state handler
                >
                    <option value="Standard">Standard</option>
                    <option value="SubStandard">SubStandard</option>
                    <option value="Lower">Lower</option>
                </select>
            </div>
        </div>
    </div>

    <div>
    {/* LINKED PRODUCTS Section */}
    <label className="pb-2 font-bold mt-6 block">LINKED PRODUCTS (See your linked products for upsell and cross-sells)</label>
    <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
        <div className="flex justify-between gap-4">
            {/* Column 1 - Upsells */}
            <div className="w-1/2">
                <label className="pb-2">Upsells</label>
                <input
                    type="text"
                    name="upsells"
                    className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter upsell products..."
                />
            </div>
            {/* Column 2 - Cross-sells */}
            <div className="w-1/2">
                <label className="pb-2">Cross-sells</label>
                <input
                    type="text"
                    name="crosssells"
                    className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter cross-sell products..."
                />
            </div>
        </div>
    </div>

    {/* MANAGE ATTRIBUTES Section */}
    <label className="pb-2 font-bold mt-6 block">MANAGE ATTRIBUTES (Manage attributes for this simple product)</label>
    <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
        <div className="flex justify-between gap-4">
            {/* Column 1 - Attribute Selector */}
            <div className="w-1/3">
                <label className="pb-2">Attributes</label>
                <select
                    className="w-full mt-2 border h-[35px] rounded-[5px]"
                >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                </select>
            </div>
            {/* Column 2 - Add Attribute Button */}
            <div className="w-1/3 flex items-end">
                <button className="w-full bg-blue-500 text-white h-[35px] rounded-[5px] hover:bg-blue-600">
                    Add Attribute
                </button>
            </div>
            {/* Column 3 - Save Attribute Button */}
            <div className="w-1/3 flex items-end">
                <button className="w-full bg-yellow-500 text-white h-[35px] rounded-[5px] hover:bg-yellow-600">
                    Save Attribute
                </button>
            </div>
        </div>
    </div>

    {/* DISCOUNT OPTIONS Section */}
    <label className="pb-2 font-bold mt-6 block">DISCOUNT OPTIONS (Set your discount for this product)</label>
    <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
        <div>
            <input
                type="checkbox"
                id="enable-bulk-discount"
            />
            <label htmlFor="enable-bulk-discount" className="pl-2">
                Enable bulk discount
            </label>
        </div>
    </div>

    {/* RMA OPTIONS Section */}
    <label className="pb-2 font-bold mt-6 block">RMA OPTIONS (Set your return and warranty settings to override global settings)</label>
    <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
        <div>
            <input
                type="checkbox"
                id="override-rma-settings"
            />
            <label htmlFor="override-rma-settings" className="pl-2">
                Override your default RMA settings for this product
            </label>
        </div>
    </div>
</div>
<br />
<div>
    {/* MIN/MAX OPTIONS Section */}
    <label className="pb-2 font-bold mt-6 block">MIN/MAX OPTIONS (Manage min/max options for this product)</label>
    <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
        <div>
            <input
                type="checkbox"
                id="enable-min-max-rule"
            />
            <label htmlFor="enable-min-max-rule" className="pl-2">
                Enable Min Max Rule for this product
            </label>
        </div>
    </div>

    {/* OTHER OPTIONS Section */}
    <label className="pb-2 font-bold mt-6 block">OTHER OPTIONS (Set your extra product options)</label>
    <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
        <div className="flex justify-between gap-4">
            {/* Row 1 - Product Status and Visibility */}
            <div className="w-1/2">
                <label className="pb-2">Product Status</label>
                <select
                    className="w-full mt-2 border h-[35px] rounded-[5px]"
                >
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                </select>
            </div>
            <div className="w-1/2">
                <label className="pb-2">Visibility</label>
                <select
                    className="w-full mt-2 border h-[35px] rounded-[5px]"
                >
                    <option value="visible">Visible</option>
                    <option value="invisible">Invisible</option>
                </select>
            </div>
        </div>

        {/* Row 2 - Purchase Note */}
        <div className="mt-4">
            <label className="pb-2">Purchase Note</label>
            <input
                type="text"
                name="purchaseNote"
                className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter purchase note..."
            />
        </div>

        {/* Row 3 - Enable Product Reviews */}
        <div className="mt-4">
            <input
                type="checkbox"
                id="enable-product-reviews"
            />
            <label htmlFor="enable-product-reviews" className="pl-2">
                Enable Product Reviews
            </label>
        </div>
    </div>
</div>

                <br />
                <div>
                    <label className="pb-2">
                        Upload Images <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="file"
                        name=""
                        id="upload"
                        className="hidden"
                        multiple
                        onChange={handleImageChange}
                    />
                    <div className="w-full flex items-center flex-wrap">
                        <label htmlFor="upload">
                            <AiOutlinePlusCircle size={30} className="mt-3" color="#555" />
                        </label>
                        {images &&
                            images.map((i) => (
                                <img
                                    src={URL.createObjectURL(i)}
                                    key={i}
                                    alt=""
                                    className="h-[120px] w-[120px] object-cover m-2"
                                />
                            ))}
                    </div>
                    <br />
                    <div>
                        <input
                            type="submit"
                            value="Create"
                            className="mt-2 cursor-pointer appearance-none text-center block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
            </form>

        </div>



    );
};

export default CreateProduct;