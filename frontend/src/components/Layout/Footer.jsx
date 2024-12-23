import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className="text-darkGray mt-24">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-10 sm:px-8 px-5 pt-16 ">
        <article className="px-5 text-center sm:text-start flex sm:block flex-col items-center">
          <img src="/logo.svg" alt="brand logo" width={300} />
          <section className="grid grid-cols-2 place-items-center mt-4">
            <img src="/footer-lion.png" alt="lion art" width={150} />
            <img src="/footer-art.png" alt="lion art" width={80} />
          </section>
          <p className="text-darkBlue font-Poppins mt-8 text-sm">
            1% of every purchase is contributed to sustainable development.
          </p>
        </article>
        <article className="text-darkGray text-lg space-y-2">
          <p>SEMA Healthcare Private Limited</p>
          <p>
            Shyam Plaza, Third Floor, Mahaveer Enclave, Dwarka, Delhi – 110045
          </p>
          <p>info@semamart.com</p>
          <p>GST: 07ABKCS8538F1ZX</p>
          <p>+91 93196 54455</p>
        </article>
        <article className="text-darkGray text-lg space-y-2">
          <p>
            <Link to="#" className="hover:text-darkBlue">
              Privacy Policy
            </Link>
          </p>
          <p>
            <Link className="hover:text-darkBlue">
              Refund and Cancellation Policy
            </Link>
          </p>
          <p>
            <Link className="hover:text-darkBlue">Cookie Policy</Link>
          </p>
          <p>
            <Link className="hover:text-darkBlue">Disclaimer</Link>
          </p>
          <p>
            <Link className="hover:text-darkBlue">
              Shipping & Delivery Policy
            </Link>
          </p>
          <p>
            <Link className="hover:text-darkBlue">About Us</Link>
          </p>
          <p>
            <Link className="hover:text-darkBlue">Terms and Conditions</Link>
          </p>
        </article>
      </div>
      <div className="bg-bgGray grid place-items-center mt-4 py-2">
        <p className="text-darkBlue text-lg font-bold">
          © Copyright 2023 semamart.com. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
