import React from 'react';
import { FaLinkedin } from 'react-icons/fa';
import {
  FaSquareFacebook,
  FaSquareInstagram,
  FaSquarePinterest,
  FaSquareXTwitter,
  FaSquareYoutube
} from 'react-icons/fa6';
import { IoIosMailOpen } from 'react-icons/io';
import { IoTicketSharp } from 'react-icons/io5';
import { RiCustomerService2Fill } from 'react-icons/ri';
import Image from 'next/image';

const Footer = () => {
  return (
    <>
      <footer className="py-5 bg-neutral-700">
        {/* ======================================================== */}
        {/* ======================= SERVICES PROVIDERS ====================== */}
        {/* ======================================================== */}

        <div className="flex justify-evenly my-10 py-10 bg-neutral-600">
          <div className="mb-3 text-neutral-400">
            <RiCustomerService2Fill className="mx-auto" size={50} />
            <h6>24/7 CUSTOMER CARE</h6>
          </div>
          <div className=" mb-3 text-neutral-400">
            <IoTicketSharp className="mx-auto" size={50} />
            <h6>RESEND BOOKING CONFIRMATION</h6>
          </div>
          <div className="mb-3 text-neutral-400">
            <IoIosMailOpen className="mx-auto" size={50} />
            <h6>SUBSCRIBE TO THE NEWSLETTER</h6>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ======================= SPORTS EVENTS ====================== */}
        {/* ======================================================== */}

        <div className="max-w-7xl mx-auto text-white text-xs">
          <div className=" mb-5">
            <h6 className="font-medium mb-3">SPORTS EVENTS IN MUMBAI</h6>
            <p className="text-neutral-400">
              Running | Chess | Cycling | Sailing | Walking | Kabaddi | Baseball | Cricket | Horse Race | Boat Race
            </p>
          </div>

          {/* ======================================================== */}
          {/* ======================= TOP EVENTS IN CITIES ====================== */}
          {/* ======================================================== */}
          <div className="mb-5">
            <h6 className="font-medium mb-3">EVENTS IN TOP CITIES</h6>
            <p className="text-neutral-400">
              Events in Mumbai | Events in Delhi-NCR | Events in Chennai | Events in Bengaluru | Events in Hyderabad |
              Events in Pune | Events in Ahmedabad | Events in Kolkata | Events in Kochi
            </p>
          </div>

          {/* ======================================================== */}
          {/* ======================= CINEMAS IN TOP CITIES ====================== */}
          {/* ======================================================== */}

          <div className="mb-5">
            <h6 className="font-medium mb-3">CINEMAS IN TOP CITIES</h6>
            <p className="text-neutral-400">
              Cinemas in Mumbai | Cinemas in Delhi-NCR | Cinemas in Chennai | Cinemas in Bengaluru | Cinemas in
              Hyderabad | Cinemas in Pune | Cinemas in Ahmedabad | Cinemas in Kolkata | Cinemas in Kochi
            </p>
          </div>

          {/* ======================================================== */}
          {/* ======================= PLAYS IN TOP CITIES ====================== */}
          {/* ======================================================== */}

          <div className=" mb-5">
            <h6 className="font-medium mb-3">PLAYS IN TOP CITIES</h6>
            <p className="text-neutral-400">
              Plays in Mumbai | Plays in Delhi-NCR | Plays in Chennai | Plays in Bengaluru | Plays in Hyderabad | Plays
              in Pune | Plays in Ahmedabad | Plays in Kolkata | Plays in Kochi
            </p>
          </div>
          <div className=" mb-5">
            <h6 className="font-medium mb-3">COUNTRIES</h6>
            <p className="text-neutral-400">Indonesia | Singapore | Sri Lanka | West Indies</p>
          </div>
          <div className=" mb-5">
            <h6 className="font-medium mb-3">HELP</h6>
            <p className="text-neutral-400">
              About Us | Contact Us | Current Opening | Press Release | Press Coverage | Sitemap | FAQs | Terms and
              Conditions | Privacy Policy
            </p>
          </div>
          <div className=" mb-5">
            <h6 className="font-medium mb-3">BOOKMYSHOW EXCLUSIVES</h6>
            <p className="text-neutral-400">
              Lollapalooza India | BookAChange | Corporate Vouchers | Gift Cards | List My Show | Offers | Stream |
              Trailers
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ======================= SOCIALS MEDIAS LINKS ====================== */}
        {/* ======================================================== */}

        <div className="container px-5 pt-10 mx-auto">
          <div className="relative flex items-center justify-center w-full">
            <div className="absolute left-0 w-2/5 border-b border-neutral-500"></div>
            <div>
              <Image src='/images/MainLogo.svg' alt="Logo" width={100} height={100} className="h-10 w-auto" />
            </div>
            <div className="absolute right-0 w-2/5 border-b border-neutral-500"></div>
          </div>

          <div className="social-icons flex justify-center my-10 space-x-5">
            <FaSquareFacebook className="text-neutral-400 hover:text-white duration-200" size={25} />
            <FaSquareXTwitter className="text-neutral-400 hover:text-white duration-200" size={25} />
            <FaSquareInstagram className="text-neutral-400 hover:text-white duration-200" size={25} />
            <FaSquareYoutube className="text-neutral-400 hover:text-white duration-200" size={25} />
            <FaSquarePinterest className="text-neutral-400 hover:text-white duration-200" size={25} />
            <FaLinkedin className="text-neutral-400 hover:text-white duration-200" size={25} />
          </div>

          <div className="text-center text-white text-xs">
            <p className="mb-3">Copyright 2025 © Bigtree Entertainment Pvt. Ltd. All Rights Reserved.</p>
            <p className="max-w-5xl mx-auto mb-3">
              The content and images used on this site are copyright protected and copyrights vests with the respective
              owners. The usage of the content and images on this website is intended to promote the works and no
              endorsement of the artist shall be implied. Unauthorized use is prohibited and punishable by law.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
