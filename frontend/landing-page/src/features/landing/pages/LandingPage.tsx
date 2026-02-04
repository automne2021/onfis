import { Link } from 'react-router-dom';
import {
  ArrowRightAltOutlined,
  CheckCircleOutlineOutlined,
  CallOutlined,
  EmailOutlined
}from '@mui/icons-material';
import OverviewCard from '../components/OverviewCard';
import { contactFormFields, overviewContents, planOptionContents, projectManagementContents } from '../config/LandingPageData';
import PlanCard from '../components/PlanCard';
import ContactForm from '../components/ContactForm/ContactForm';
import type { ContactFormData } from '../components/ContactForm/type';

import consultantImage from '../../../assets/images/consultant_illustrator.png';

export default function LandingPage() {

  const handleFormSubmit = (data: ContactFormData) => {
    console.log("Received Data from Child:", data);
    // API Call
    alert(`Thank you, ${data.fullname}! We received your message.`);
  };

  return(
    <>
      {/* Hero Section */}
      <section className="w-full px-4 md:px-5 xl:px-8 2xl:px-[220px] pt-[86px] flex items-center">
        {/* Left section */}
        <div className="w-full h-[400px] text-center md:text-left  md:h-auto md:w-1/2 flex flex-col gap-6 justify-center items-center md:items-start">
          <h1 className="header-h1 text-primary">Ditigal Workspace</h1>
          <p className="body-1-regular text-neutral-700">
            Project management system that enables your teams to collaborate, plan, analyze and manage everyday tasks
          </p>
          {/* Buttons */}
          <div className='flex gap-3'>
            <Link
              to={`/`} 
              className="px-5 py-3 rounded-[8px] bg-primary hover:bg-primary-hover text-neutral-50 border transition flex items-center gap-1">
              Try for free <span><ArrowRightAltOutlined /></span>
            </Link>
            <Link 
              to={`/`}
              className="px-5 py-3 rounded-[8px] bg-secondary hover:bg-secondary-hover text-neutral-50 hover:text-neutral-50 border transition cursor-pointer flex items-center gap-1">
              Pricing
            </Link>
          </div>
        </div>
        {/* Right section - Hero image */}
        <div className="hidden md:flex w-1/2 items-center justify-center">
          {/* Grey Rectangle Placeholder */}
          <div className="w-full h-[600px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
            Image Placeholder
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className='w-full px-4 md:px-5 xl:px-8 2xl:px-[220px] mt-12 flex flex-col items-center'>
        {/* Text Block */}
        <div className='flex flex-col items-center'>
          <p className='body-1-medium text-primary'>Overview</p>
          <p className='header-h4 text-neutral-900'>
            Comprehensive Digitalization of the Work Environment
          </p>
        </div>
        {/* Cards */}
        <div className='w-full flex flex-wrap justify-center gap-4 mt-6'>
          {overviewContents.map((item, idx) => (
            <OverviewCard key={idx} title={item.title} contents={item.contents}/>
          ))}
        </div>
      </section>

      {/* Project Management Section */}
      <section className='w-full px-4 md:px-5 xl:px-8 2xl:px-[220px] pt-[86px] flex items-center'>
        {/* Left section */}
        <div className='w-full h-[400px] text-center md:text-left  md:h-auto md:w-1/2 flex flex-col gap-6 justify-center items-center md:items-start'>
          <p className='header-h2 text-neutral-900'>Project Management</p>
          {/* Content */}
          <div className='flex flex-col gap-3 mt-6'>
            {projectManagementContents.map((item, idx) => (
              <div key={idx} className='flex items-start gap-2'>
                <CheckCircleOutlineOutlined className='text-secondary'/>
                <p className='body-2-medium text-secondary'>
                  {item.content}
                  <span className='body-2-regular text-neutral-900'> {item.subcontent}</span>
                </p>
              </div>
            ))}
          </div>
          {/* Button */}
          <Link
            to={`/`}
            className='px-5 py-3 rounded-[8px] bg-primary hover:bg-primary-hover text-neutral-50 border transition cursor-pointer flex items-center gap-1'
          >
            Get Started <ArrowRightAltOutlined /> 
          </Link>
        </div>
        {/* Right section - Image */}
        <div className="hidden md:flex w-1/2 items-center justify-center">
          {/* Grey Rectangle Placeholder */}
          <div className="w-full h-[600px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
            Image Placeholder
          </div>
        </div>
      </section>

      {/* Work together Section */}
      <section className='w-full px-4 md:px-5 xl:px-8 2xl:px-[220px] pt-[86px] flex items-center'>

        {/* Left section - Image */}
        <div className="hidden md:flex w-1/2 items-center justify-center">
          {/* Grey Rectangle Placeholder */}
          <div className="w-full h-[600px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
            Image Placeholder
          </div>
        </div>

        {/* Right section */}
        <div className='w-full h-[400px] text-center md:text-left  md:h-auto md:w-1/2 flex flex-col gap-6 justify-center items-center md:items-start ml-12'>
          <p className='header-h2 text-neutral-900'>Work together</p>
          {/* Content */}
          <div className='flex flex-col gap-3 mt-6'>
            {projectManagementContents.map((item, idx) => (
              <div key={idx} className='flex items-start gap-2'>
                <CheckCircleOutlineOutlined className='text-secondary'/>
                <p className='body-2-medium text-secondary'>
                  {item.content}
                  <span className='body-2-regular text-neutral-900'> {item.subcontent}</span>
                </p>
              </div>
            ))}
          </div>
          {/* Button */}
          <Link
            to={`/`}
            className='px-5 py-3 rounded-[8px] bg-primary hover:bg-primary-hover text-neutral-50 border transition cursor-pointer flex items-center gap-1'
            >
            Try it now <ArrowRightAltOutlined /> 
          </Link>
        </div>
      </section>

      {/* About section */}
      <section className='w-full px-4 md:px-5 xl:px-8 2xl:px-[220px] py-[86px] mt-12 bg-primary '>
        <h2 className='header-h2 text-neutral-50 text-center'>About us</h2>
        <p className='text-neutral-50 mt-6'>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Maxime est impedit placeat, pariatur reprehenderit quam corrupti assumenda porro iure quos labore tempora id doloremque magni amet dolorum hic quod! Quam?
        </p>
      </section>

      {/* Pricing section */}
      <section className='w-full px-4 md:px-5 xl:px-8 2xl:px-[220px] pt-[86px] flex flex-col items-center justify-center'>
        {/* Text block */}
        <div className='w-full flex flex-col gap-4'>
          <h2 className='text-neutral-900 header-h2 text-center'>Choose your plan</h2>
          <p className='body-2-regular text-neutral-700 text-center'>
            Whether you want to get organized, keep your personal life on track, or boost workplace productivity, Evernote has the right plan for you.
          </p>
        </div>
        {/* Plan card */}
        <div className='w-full flex flex-wrap justify-center gap-4 mt-12 items-center'>
          {planOptionContents.map((item, idx) => (
            <PlanCard 
              key={idx}
              isBestOption={idx === 1 ? true : false} // Chỉ có card ở giữa mới là best option
              type={item.type}
              description={item.description}
              price={item.price}
              priceDescription={item.priceDescription}
              contents={item.contents}
            />
          ))}
        </div>
      </section>

      {/* Contact section */}
      <section className='w-full px-4 md:px-5 xl:px-8 2xl:px-[220px] py-[86px] bg-primary mt-12'>
        {/* Text Block*/}
        <div className=''>
          <h2 className='header-h2 text-neutral-50 text-center'>Contact us</h2>
          <p className='body-1-regular text-neutral-50 text-center mt-4'>
            Get in touch for a detailed consultation and a custom quote tailored to your business needs.
          </p>
        </div>
        {/* Main content area */}
        <div className='w-full mt-6 flex gap-6'>
          {/* Left section - contact form */}
          <div className='w-full md:w-1/2 bg-neutral-50 rounded-[8px] px-6 py-4'>
            <ContactForm contactData={contactFormFields} onSubmitData={handleFormSubmit}/>
          </div>

          {/* Right section - Basic info/Image */}
          <div className="hidden md:flex w-1/2 items-center justify-start px-6 py-4 rounded-xl bg-transparent flex-col">
            <img src={consultantImage} alt="consultant illustrator" className='h-[300px] align-center'/>
            <p className='text-neutral-50 body-1-regular mt-4 text-center'>
              If you have any question or need discussion, please exchange more details with us to receive a specific quote for your business needs.
            </p>
            <hr className='w-full border-neutral-50 my-4' />
            <div className='w-full flex flex-col gap-4 items-start'>
              <p className='flex gap-2 items-center justify-center text-neutral-50 body-2-regular'>
                <span className='bg-secondary p-2 rounded-full flex items-center justify-center'>
                  <EmailOutlined />
                </span>
                Email: abc123@email.com
              </p>
              <p className='flex gap-2 items-center justify-center text-neutral-50'>
                <span className='bg-secondary p-2 rounded-full flex items-center justify-center'>
                  <CallOutlined />
                </span>
                Phone number: (+84)123-456-789
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}