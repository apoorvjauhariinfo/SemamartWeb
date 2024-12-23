import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/styles";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { getAllProductsShop } from "../../redux/actions/product";
import { backend_url, server } from "../../server";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "./Ratings";
import axios from "axios";
import { ProductDetailsRows } from "./Ui.productDetail";
import { ActionBtn, SecondryBtn } from "../UI/Buttons";

const ProductDetails = ({ data }) => {
  const { products } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [select, setSelect] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getAllProductsShop(data && data?.shop._id));
    if (wishlist && wishlist.find((i) => i._id === data?._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [data, wishlist]);

  // Remove from wish list
  const removeFromWishlistHandler = (data) => {
    setClick(!click);
    dispatch(removeFromWishlist(data));
  };

  // add to wish list
  const addToWishlistHandler = (data) => {
    setClick(!click);
    dispatch(addToWishlist(data));
  };

  // Add to cart
  const addToCartHandler = (id) => {
    const isItemExists = cart && cart.find((i) => i._id === id);

    if (isItemExists) {
      toast.error("item already in cart!");
    } else {
      if (data.stock < 1) {
        toast.error("Product stock limited!");
      } else {
        const cartData = { ...data, qty: count };
        dispatch(addTocart(cartData));
        toast.success("Item added to cart Successfully!");
      }
    }
  };

  const incrementCount = () => {
    setCount(count + 1);
  };
  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const totalReviewsLength =
    products &&
    products.reduce((acc, product) => acc + product.reviews.length, 0);

  const totalRatings =
    products &&
    products.reduce(
      (acc, product) =>
        acc + product.reviews.reduce((sum, review) => sum + review.rating, 0),
      0,
    );

  const avg = totalRatings / totalReviewsLength || 0;

  const averageRating = avg.toFixed(2);

  // Sand message
  const handleMessageSubmit = async () => {
    if (isAuthenticated) {
      const groupTitle = data._id + user._id;
      const userId = user._id;
      const sellerId = data.shop._id;
      await axios
        .post(`${server}/conversation/create-new-conversation`, {
          groupTitle,
          userId,
          sellerId,
        })
        .then((res) => {
          navigate(`/inbox?${res.data.conversation._id}`);
        })
        .catch((error) => {
          toast.error(error.response.data.message);
        });
    } else {
      toast.error("Please login to create a conversation");
    }
  };

  return (
    <div className="bg-white pb-8">
      {data ? (
        <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
          <div className="w-full py-5">
            <div className="block w-full 800px:flex gap-8">
              <div className="w-full 800px:w-[50%]">
                <section className="grid grid-cols-[1fr_6fr] items-start h-full">
                  <div className="max-w-[90px]">
                    {data &&
                      data.images.map((el, index) => (
                        <div
                          className={`${
                            select === index
                              ? "border-2 border-darkBlue"
                              : "border"
                          } cursor-pointer`}
                        >
                          <img
                            src={`${backend_url}${el}`}
                            alt=""
                            className="h-[80px] overflow-hidden mr-3 mt-3"
                            onClick={() => setSelect(index)}
                          />
                        </div>
                      ))}
                    <div
                      className={
                        "aspect-square flex items-center " +
                        (select === "vid"
                          ? "border-2 border-darkBlue"
                          : "border")
                      }
                      onClick={() => setSelect("vid")}
                    >
                      <video>
                        <source
                          src={backend_url + data.shortVideo}
                          type="video/mp4"
                        />
                      </video>
                    </div>
                  </div>
                  <article className="self-center">
                    {select === "vid" ? (
                      <video controls>
                        <source
                          src={backend_url + data.shortVideo}
                          type="video/mp4"
                        />
                      </video>
                    ) : (
                      <img
                        src={`${backend_url}${data && data.images[select]}`}
                        alt=""
                        className="w-[80%]"
                      />
                    )}
                  </article>
                </section>
              </div>
              {/* Rtght */}
              <div className="w-full 800px:w-[50%] pt-5 ">
                <section className="border-b">
                  <h1 className={`${styles.productTitle}`}>{data.name}</h1>
                </section>
                <div className="mt-6 font-Poppins">
                  {data?.originalPrice && (
                    <p className="font-Roboto text-slate-600 pl-[62px] text-sm mb-1">
                      Price:
                      <span className="line-through pl-4 text-lg">
                        ₹{data.originalPrice}
                      </span>
                    </p>
                  )}
                  <section className="font-Roboto text-slate-700 flex gap-4">
                    <p className="mt-1 text-sm text-darkBlue font-semibold">
                      Business Price:{" "}
                    </p>
                    <article className="">
                      <p className="text-3xl text-red-600">
                        ₹{data.discountPrice}{" "}
                        <span className="text-lg">excl. GST</span>
                      </p>
                      <p className="text-xl text-red-600">
                        ₹2222 <span className="text-sm">incl. GST</span>
                      </p>
                    </article>
                  </section>
                </div>
                {/* incremnt decremnrt btns */}
                <div className="flex items-center mt-4 justify-between pr-3">
                  <article className="flex gap-4">
                    <div className="grid grid-cols-3 border">
                      <button
                        className="font-bold rounded-l px-4 py-2 hover:opacity-75 transition duration-300 ease-in-out"
                        onClick={decrementCount}
                      >
                        -
                      </button>
                      <span className="text-slate-700 font-medium px-4 py-[11px]">
                        {count}
                      </span>
                      <button
                        className="font-bold rounded-r px-[14px] py-2 hover:opacity-75 transition duration-300 ease-in-out"
                        onClick={incrementCount}
                      >
                        +
                      </button>
                    </div>
                    <ActionBtn onClick={() => addToCartHandler(data._id)}>
                      Add to Cart <AiOutlineShoppingCart className="ml-1" />
                    </ActionBtn>
                  </article>
                  <div>
                    {click ? (
                      <AiFillHeart
                        size={30}
                        className="cursor-pointer"
                        onClick={() => removeFromWishlistHandler(data)}
                        color={click ? "red" : "#333"}
                        title="Remove from wishlist"
                      />
                    ) : (
                      <AiOutlineHeart
                        size={30}
                        className="cursor-pointer"
                        onClick={() => addToWishlistHandler(data)}
                        title="Add to wishlist"
                      />
                    )}
                  </div>
                </div>
                {/* porduct description */}
                <section className="mt-8 pt-4 border-t-slate-200 border-t">
                  <p>{data.description}</p>
                </section>
                {/* seller box */}
                <div className="flex items-center pt-8">
                  <Link to={`/shop/preview/${data?.shop._id}`}>
                    <img
                      src={`${backend_url}${data?.shop?.avatar}`}
                      alt=""
                      className="w-[50px] h-[50px] rounded-full mr-2"
                    />
                  </Link>
                  <div className="pr-8">
                    <Link to={`/shop/preview/${data?.shop._id}`}>
                      <h3 className="font-Poppins">{data.shop.name}</h3>
                    </Link>
                    <h5 className="pb-3 text-[15px]">
                      {" "}
                      ({averageRating}/5) Ratingss
                    </h5>
                  </div>
                  <SecondryBtn onClick={handleMessageSubmit}>
                    Send Message <AiOutlineMessage className="ml-1" />
                  </SecondryBtn>
                </div>
              </div>
            </div>
          </div>
          {/* Product Details  info */}
          <ProductDetailsInfo
            data={data}
            products={products}
            totalReviewsLength={totalReviewsLength}
            averageRating={averageRating}
          />
        </div>
      ) : null}
    </div>
  );
};

const ProductDetailsInfo = ({
  data,
  products,
  totalReviewsLength,
  averageRating,
}) => {
  const [active, setActive] = useState(1);

  return (
    <div className="bg-lightBlue px-3 800px:px-10 py-2 rounded">
      <div className="w-full flex justify-between border-b pt-10 pb-2">
        <div className="relative">
          <h5
            className="product-detail-table-heading"
            onClick={() => setActive(1)}
          >
            Product Details
          </h5>
          {active === 1 ? (
            <div className="product-detail-table-active" />
          ) : null}
        </div>

        <div className="relative">
          <h5
            className="product-detail-table-heading"
            onClick={() => setActive(2)}
          >
            Product Reviews
          </h5>
          {active === 2 ? (
            <div className="product-detail-table-active" />
          ) : null}
        </div>

        <div className="relative">
          <h5
            className="product-detail-table-heading"
            onClick={() => setActive(3)}
          >
            Seller Information
          </h5>
          {active === 3 ? (
            <div className="product-detail-table-active" />
          ) : null}
        </div>
      </div>

      {active === 1 ? (
        <>
          <section className="py-2 text-[18px] leading-8 pb-10 whitespace-pre-line  ">
            <table className="w-full mt-6">
              <tbody>
                <ProductDetailsRows
                  label="Product Dimensions"
                  value={data.dimension + "; " + data.weight}
                />
                <ProductDetailsRows
                  label="Date first available"
                  value={new Date(data.createdAt).toLocaleDateString()}
                />
                <ProductDetailsRows
                  label="Manufacturer"
                  value={data.manufacturerName}
                />
                <ProductDetailsRows
                  label="Country of origin"
                  value={data.origin}
                />
                <ProductDetailsRows label="Category" value={data.category} />
              </tbody>
            </table>
          </section>
        </>
      ) : null}

      {/* Product Rev */}
      {active === 2 ? (
        <div className="w-full min-h-[40vh] flex flex-col items-center py-3 overflow-y-scroll">
          {data &&
            data.reviews.map((item, index) => (
              <div className="w-full flex my-2">
                <img
                  src={`${backend_url}/${item.user.avatar}`}
                  alt=""
                  className="w-[50px] h-[50px] rounded-full"
                />
                <div className="pl-2 ">
                  <div className="w-full flex items-center">
                    <h1 className="font-[500] mr-3">{item.user.name}</h1>
                    <Ratings rating={data?.ratings} />
                  </div>
                  <p>{item.comment}</p>
                </div>
              </div>
            ))}

          <div className="w-full flex justify-center">
            {data && data.reviews.length === 0 && (
              <h5>No Reviews have for this product!</h5>
            )}
          </div>
        </div>
      ) : null}

      {active === 3 ? (
        <>
          <div className="w-full block 800px:flex p-5 ">
            <div className="w-full 800px:w-[50%]">
              <div className="flex items-center">
                <Link to={`/shop/preview/${data.shop._id}`}>
                  <div className="flex items-center">
                    <img
                      src={`${backend_url}${data?.shop?.avatar}`}
                      className="w-[50px] h-[50px] rounded-full"
                      alt=""
                    />
                    <div className="pl-3">
                      <h3 className={`${styles.shop_name}`}>
                        {data.shop.name}
                      </h3>
                      <h5 className="pb-3 text-[15px]">
                        ({averageRating}/5) Ratings
                      </h5>
                    </div>
                  </div>
                </Link>
              </div>

              <p className="pt-2">{data.shop.description}</p>
            </div>

            <div className="w-full 800px:w-[50%] mt-5 800px:mt-0 800px:flex flex-col items-end">
              <div className="text-left">
                <h5 className="font-[600]">
                  Joined on:{" "}
                  <span className="font-[500]">
                    {data.shop?.createdAt?.slice(0, 10)}
                  </span>
                </h5>
                <h5 className="font-[600] pt-3">
                  Total Products:{" "}
                  <span className="font-[500]">
                    {products && products.length}
                  </span>
                </h5>
                <h5 className="font-[600] pt-3">
                  Total Reviews:{" "}
                  <span className="font-[500]">{totalReviewsLength}</span>
                </h5>
                <Link to="/">
                  <div
                    className={`${styles.button} !rounded-[4px] !h-[39.5px] mt-3`}
                  >
                    <h4 className="text-white">Visit Shop</h4>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ProductDetails;
