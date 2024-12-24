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
  const [thumbnail, setThumbnail] = useState(null);
  const [name, setName] = useState("");
  const [hsn, setHsn] = useState("");
  const [shortdescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [originalPrice, setOriginalPrice] = useState();
  const [discountPrice, setDiscountPrice] = useState();
  const [stock, setStock] = useState();
  const [productType, setProductType] = useState("");
  const [sku, setSku] = useState("");
  const [upsells, setUpsells] = useState("");
  const [crosssells, setCrossSells] = useState("");
  const [stockStatus, setStockStatus] = useState("In Stock");
  const [enableStockManagement, setEnableStockManagement] = useState(false);
  const [allowSingleQuantity, setAllowSingleQuantity] = useState(false);
  const [taxStatus, setTaxStatus] = useState("Taxable");
  const [taxClass, setTaxClass] = useState("Standard");
  const [discountOptions, setDiscountOptions] = useState("");
  const [rma, setRma] = useState("");
  const [minmaxrule, setMinMacRule] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const [visibiliy, setVisibility] = useState("Visible");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [allowproductreviews, setAllowProductReviews] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState("grams");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [height, setHeight] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("metre");
  const [manufacturerName, setManufacturerName] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("Manu1");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("country1");
  const [shortVideo, setShortVideo] = useState(null);

  // Consolidated Values
  const weight = `${weightValue}/${weightUnit}`;
  const dimension = `${length}X${breadth}X${height}/${dimensionUnit}`;

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

  const handleThumbnailChange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) setThumbnail(file);
  };
  const handleImageChange = (e) => {
    e.preventDefault();

    let files = Array.from(e.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
  };

  console.log(images);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newForm = new FormData();
    if (thumbnail) newForm.append("thumbnail", thumbnail);

    if (shortVideo) {
      newForm.append("shortVideo", shortVideo);
    }

    images.forEach((image) => {
      newForm.append("images", image);
    });
    newForm.append("name", name);
    newForm.append("hsn", hsn);
    newForm.append("productType", productType);
    newForm.append("originalPrice", originalPrice);
    newForm.append("discountPrice", discountPrice);
    newForm.append("category", category);
    newForm.append("tags", tags);
    newForm.append("shortdescription", shortdescription);
    newForm.append("description", description);
    newForm.append("stock", stock);
    newForm.append("sku", sku);
    newForm.append("stockStatus", stockStatus);
    newForm.append("enableStockManagement", enableStockManagement);
    newForm.append("allowSingleQuantity", allowSingleQuantity);
    newForm.append("taxStatus", taxStatus);
    newForm.append("taxClass", taxClass);
    newForm.append("upsells", upsells);
    newForm.append("crosssells", crosssells);
    newForm.append("discountoptions", discountOptions);
    newForm.append("rma", rma);
    newForm.append("minmaxrule", minmaxrule);
    newForm.append("productStatus", productStatus);
    newForm.append("visibility", visibiliy);
    newForm.append("purchaseNote", purchaseNote);
    newForm.append("allowproductreviews", allowproductreviews);
    newForm.append("weight", weight);
    newForm.append("dimension", dimension);
    newForm.append("manufacturerName", manufacturerName);
    newForm.append("email", email);
    newForm.append("phone", phone);
    newForm.append("origin", countryOfOrigin);
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
            HSN Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={hsn}
            className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            onChange={(e) => setHsn(e.target.value)}
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
            onChange={(e) => setShortDescription(e.target.value)}
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
        <div className="flex justify-between gap-4">
          <div className="w-1/2">
            <label className="pb-2">Stock Avalaible</label>
            <input
              type="number"
              name="stock"
              value={stock}
              className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              onChange={(e) => setStock(e.target.value)}
              placeholder="Enter your product stock avalaible..."
            />
          </div>
        </div>
        <br />

        <div>
          <label className="pb-2 font-bold">
            INVENTORY (Manage inventory for this product)
          </label>
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
                Allow only one quantity of this product to be bought in a single
                order
              </label>
            </div>
          </div>
        </div>
        <br />
        {/* SHIPPING AND TAX Section */}
        <label className="pb-2 font-bold mt-6 block">
          SHIPPING AND TAX (Manage shipping and tax for this product)
        </label>
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
          <label className="pb-2 font-bold mt-6 block">
            LINKED PRODUCTS (See your linked products for upsell and
            cross-sells)
          </label>
          <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
            <div className="flex justify-between gap-4">
              {/* Column 1 - Upsells */}
              <div className="w-1/2">
                <label className="pb-2">Upsells</label>
                <input
                  type="text"
                  name="upsells"
                  value={upsells} // Add a state variable for SKU
                  onChange={(e) => setUpsells(e.target.value)} // Add corresponding state handler
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
                  value={crosssells} // Add a state variable for SKU
                  onChange={(e) => setCrossSells(e.target.value)} // Add corresponding state handler
                  className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter cross-sell products..."
                />
              </div>
            </div>
          </div>

          {/* MANAGE ATTRIBUTES Section */}
          <label className="pb-2 font-bold mt-6 block">
            MANAGE ATTRIBUTES (Manage attributes for this simple product)
          </label>
          <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
            <div className="flex justify-between gap-4">
              {/* Column 1 - Attribute Selector */}
              <div className="w-1/3">
                <label className="pb-2">Attributes</label>
                <select className="w-full mt-2 border h-[35px] rounded-[5px]">
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
          <label className="pb-2 font-bold mt-6 block">
            DISCOUNT OPTIONS (Set your discount for this product)
          </label>
          <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
            <div>
              <input
                type="checkbox"
                id="enable-bulk-discount"
                checked={discountOptions}
                onChange={(e) => setDiscountOptions(e.target.checked)}
              />
              <label htmlFor="enable-bulk-discount" className="pl-2">
                Enable bulk discount
              </label>
            </div>
          </div>

          {/* RMA OPTIONS Section */}
          <label className="pb-2 font-bold mt-6 block">
            RMA OPTIONS (Set your return and warranty settings to override
            global settings)
          </label>
          <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
            <div>
              <input
                type="checkbox"
                id="override-rma-settings"
                checked={rma} // Add a state variable for single quantity allowance
                onChange={(e) => setRma(e.target.checked)}
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
          <label className="pb-2 font-bold mt-6 block">
            MIN/MAX OPTIONS (Manage min/max options for this product)
          </label>
          <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
            <div>
              <input
                type="checkbox"
                id="enable-min-max-rule"
                checked={minmaxrule} // Add a state variable for single quantity allowance
                onChange={(e) => setMinMacRule(e.target.checked)}
              />
              <label htmlFor="enable-min-max-rule" className="pl-2">
                Enable Min Max Rule for this product
              </label>
            </div>
          </div>

          {/* OTHER OPTIONS Section */}
          <label className="pb-2 font-bold mt-6 block">
            OTHER OPTIONS (Set your extra product options)
          </label>
          <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
            <div className="flex justify-between gap-4">
              {/* Row 1 - Product Status and Visibility */}
              <div className="w-1/2">
                <label className="pb-2">Product Status</label>
                <select
                  className="w-full mt-2 border h-[35px] rounded-[5px]"
                  value={productStatus} // Add a state variable for tax class
                  onChange={(e) => setProductStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div className="w-1/2">
                <label className="pb-2">Visibility</label>
                <select
                  className="w-full mt-2 border h-[35px] rounded-[5px]"
                  value={visibiliy} // Add a state variable for tax class
                  onChange={(e) => setVisibility(e.target.value)}
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
                value={purchaseNote} // Add a state variable for SKU
                onChange={(e) => setPurchaseNote(e.target.value)}
                className="mt-2 appearance-none block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter purchase note..."
              />
            </div>

            {/* Row 3 - Enable Product Reviews */}
            <div className="mt-4">
              <input
                type="checkbox"
                id="enable-product-reviews"
                checked={allowproductreviews} // Add a state variable for single quantity allowance
                onChange={(e) => setAllowProductReviews(e.target.checked)}
              />
              <label htmlFor="enable-product-reviews" className="pl-2">
                Enable Product Reviews
              </label>
            </div>
          </div>
        </div>

        <br />

        <label className="pb-2 font-bold mt-6 block">SHIPPING DETAILS</label>
        <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
          {/* Row 1 - Weight Input and Selector */}
          <div className="flex justify-between gap-4">
            <div className="w-1/2">
              <label className="pb-2">Weight</label>
              <input
                type="number"
                name="weight"
                className="w-full mt-2 appearance-none block h-[35px] px-3 border border-gray-300 rounded-[5px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter weight..."
                min="0"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label className="pb-2">Weight Unit</label>
              <select
                name="weightUnit"
                className="w-full mt-2 border h-[35px] rounded-[5px]"
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
              >
                <option value="grams">Grams</option>
                <option value="kilograms">Kilograms</option>
                <option value="pounds">Pounds</option>
              </select>
            </div>
          </div>

          {/* Row 2 - Dimension Inputs and Selector */}
          <div className="flex justify-between gap-4 mt-4">
            <div className="w-1/2">
              <label className="pb-2">Dimensions (L × B × H)</label>
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  name="length"
                  className="w-1/3 appearance-none block h-[35px] px-3 border border-gray-300 rounded-[5px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="L"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
                <input
                  type="number"
                  name="breadth"
                  className="w-1/3 appearance-none block h-[35px] px-3 border border-gray-300 rounded-[5px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="B"
                  min="0"
                  value={breadth}
                  onChange={(e) => setBreadth(e.target.value)}
                />
                <input
                  type="number"
                  name="height"
                  className="w-1/3 appearance-none block h-[35px] px-3 border border-gray-300 rounded-[5px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="H"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>
            <div className="w-1/2">
              <label className="pb-2">Dimension Unit</label>
              <select
                name="dimensionUnit"
                className="w-full mt-2 border h-[35px] rounded-[5px]"
                value={dimensionUnit}
                onChange={(e) => setDimensionUnit(e.target.value)}
              >
                <option value="metre">Metre</option>
                <option value="centimetre">Centimetre</option>
                <option value="millimetre">Millimetre</option>
              </select>
            </div>
          </div>
        </div>
        <br />

        <label className="pb-2 font-bold mt-6 block">
          MANUFACTURER DETAILS
        </label>
        <div className="border border-gray-300 rounded-[5px] p-4 mt-2">
          {/* Row 1 - Manufacturer Name and Selector */}
          <div className="flex justify-between gap-4">
            <div className="w-1/2">
              <label className="pb-2">Manufacturer Name</label>
              <input
                type="text"
                name="manufacturerName"
                className="w-full mt-2 appearance-none block h-[35px] px-3 border border-gray-300 rounded-[5px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter Manufacturer Name..."
                value={manufacturerName}
                onChange={(e) => setManufacturerName(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label className="pb-2">Select Manufacturer</label>
              <select
                name="selectedManufacturer"
                className="w-full mt-2 border h-[35px] rounded-[5px]"
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
              >
                <option value="Manu1">Manu1</option>
                <option value="Manu2">Manu2</option>
                <option value="Manu3">Manu3</option>
              </select>
            </div>
          </div>

          {/* Row 2 - Email Input */}
          <div className="mt-4">
            <label className="pb-2">Email Address</label>
            <input
              type="email"
              name="email"
              className="w-full mt-2 appearance-none block h-[35px] px-3 border border-gray-300 rounded-[5px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter a valid email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Row 3 - Phone Input */}
          <div className="mt-4">
            <label className="pb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="w-full mt-2 appearance-none block h-[35px] px-3 border border-gray-300 rounded-[5px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter a valid phone number..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Row 4 - Country of Origin and Selector */}
          <div className="flex justify-between gap-4 mt-4">
            <div className="w-1/2">
              <label className="pb-2">Country of Origin</label>
              <input
                type="text"
                name="countryOfOrigin"
                className="w-full mt-2 appearance-none block h-[35px] px-3 border border-gray-300 rounded-[5px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter Country of Origin..."
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label className="pb-2">Select Country</label>
              <select
                name="selectedCountry"
                className="w-full mt-2 border h-[35px] rounded-[5px]"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="country1">Country1</option>
                <option value="country2">Country2</option>
              </select>
            </div>
          </div>
        </div>
        <br />
        <div className="border border-gray-300 p-4 rounded-[5px]">
          {/* Heading */}
          <h2 className="text-lg font-bold mb-4">Product Image Upload</h2>

          {/* Thumbnail Upload */}
          <div className="mb-6">
            <label className="block font-medium mb-2">
              Upload Thumbnail Image
            </label>
            <div className="border border-gray-300 h-[120px] w-[120px] flex items-center justify-center rounded-[5px] cursor-pointer">
              <label htmlFor="uploadThumbnail" className="cursor-pointer">
                {thumbnail ? (
                  <img
                    src={URL.createObjectURL(thumbnail)}
                    alt="Thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AiOutlinePlusCircle size={30} color="#555" />
                )}
              </label>
            </div>
            <input
              type="file"
              id="uploadThumbnail"
              className="hidden"
              onChange={handleThumbnailChange}
            />
          </div>

          {/* Other Images Upload */}
          <div>
            <label className="block font-medium mb-2">
              Upload Other Images
            </label>
            <div className="flex gap-4 flex-wrap">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="border border-gray-300 h-[120px] w-[120px] flex items-center justify-center rounded-[5px] cursor-pointer"
                >
                  <label
                    htmlFor={`uploadImage-${index}`}
                    className="cursor-pointer"
                  >
                    {images[index] ? (
                      <img
                        src={URL.createObjectURL(images[index])}
                        alt={`Image-${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AiOutlinePlusCircle size={30} color="#555" />
                    )}
                  </label>
                  <input
                    type="file"
                    id={`uploadImage-${index}`}
                    className="hidden"
                    onChange={(e) => handleImageChange(e)}
                  />
                </div>
              ))}
            </div>
          </div>

          <br />
          {/* Short Video Upload */}
          <div className="mb-6">
            <label className="block font-medium mb-2">
              Upload Short Video (Max: 2MB)
            </label>
            <div className="border border-gray-300 h-[120px] w-[120px] flex items-center justify-center rounded-[5px] cursor-pointer">
              <label htmlFor="uploadShortVideo" className="cursor-pointer">
                {shortVideo ? (
                  <video
                    controls
                    src={URL.createObjectURL(shortVideo)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AiOutlinePlusCircle size={30} color="#555" />
                )}
              </label>
            </div>
            <input
              type="file"
              id="uploadShortVideo"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.size > 2 * 1024 * 1024) {
                  alert("Video size should not exceed 2MB.");
                  return;
                }
                setShortVideo(file); // Update state for short video
              }}
            />
          </div>
          <br />

          {/* Submit Button */}
          <div className="mt-6">
            <input
              type="submit"
              value="Create"
              className="cursor-pointer appearance-none text-center block w-full px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
